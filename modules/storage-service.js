/**
 * Storage Service Module
 *
 * Provides a data access layer that keeps all private scripts/groups in
 * chrome.storage.local while still allowing reads from the public catalog
 * and batch publishing to Supabase when needed.
 */

// --- Adapters ---

/**
 * LocalAdapter
 * Wraps chrome.storage.local to provide a consistent async interface for local data persistence.
 */
class LocalAdapter {
  getFallbackStore() {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage;
      }
    } catch (_) { }
    return null;
  }

  canUseChromeStorage() {
    try {
      if (typeof chrome === 'undefined') return false;
      if (!chrome.storage || !chrome.storage.local) return false;
      if (!chrome.runtime || !chrome.runtime.id) return false;
      if (typeof ChatListUtils !== 'undefined' && typeof ChatListUtils.isExtensionContextValid === 'function') {
        return ChatListUtils.isExtensionContextValid();
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  handleChromeStorageError(error, action) {
    const message = error?.message || '';
    const isContextInvalid = message.includes('Extension context invalidated');
    if (isContextInvalid) {
      console.warn(`LocalAdapter: chrome.storage 上下文失效，执行 ${action} 时使用 localStorage 回退`);
      if (typeof ChatListUtils !== 'undefined' && typeof ChatListUtils.showContextInvalidatedNotice === 'function') {
        ChatListUtils.showContextInvalidatedNotice();
      }
    } else {
      console.error(`LocalAdapter: Failed to ${action}.`, error);
    }
  }

  deserializeFallbackValue(value) {
    if (value === undefined || value === null || value === '') return '';
    try {
      return JSON.parse(value);
    } catch (_) {
      return value;
    }
  }

  serializeFallbackValue(value) {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string') return value;
    try {
      return JSON.stringify(value);
    } catch (_) {
      return '';
    }
  }

  getFromFallback(keys) {
    const res = {};
    const store = this.getFallbackStore();
    if (!store) {
      keys.forEach(k => { res[k] = ''; });
      return res;
    }
    try {
      keys.forEach(k => {
        const stored = store.getItem(k);
        res[k] = this.deserializeFallbackValue(stored);
      });
    } catch (error) {
      console.error('LocalAdapter: localStorage 读取失败.', error);
      keys.forEach(k => { res[k] = ''; });
    }
    return res;
  }

  setToFallback(data) {
    const store = this.getFallbackStore();
    if (!store) return;
    try {
      Object.entries(data).forEach(([k, v]) => {
        const serialized = this.serializeFallbackValue(v);
        store.setItem(k, serialized);
      });
    } catch (error) {
      console.error('LocalAdapter: localStorage 写入失败.', error);
    }
  }

  async get(keys) {
    if (this.canUseChromeStorage()) {
      try {
        return await chrome.storage.local.get(keys);
      } catch (error) {
        this.handleChromeStorageError(error, 'get data');
      }
    }
    return this.getFromFallback(keys);
  }

  async set(data) {
    if (this.canUseChromeStorage()) {
      try {
        await chrome.storage.local.set(data);
        return;
      } catch (error) {
        this.handleChromeStorageError(error, 'set data');
      }
    }
    this.setToFallback(data);
  }

  async getData() {
    const r = await this.get(['chatScripts', 'chatGroups']);
    return {
      scripts: Array.isArray(r.chatScripts) ? r.chatScripts : [],
      groups: Array.isArray(r.chatGroups) ? r.chatGroups : []
    };
  }

  async saveData(scripts, groups) {
    await this.set({ chatScripts: scripts, chatGroups: groups });
  }
}

/**
 * SupabaseAdapter
 * Encapsulates all communication with the Supabase backend.
 */
class SupabaseAdapter {
  constructor() {
    this.client = window.supabaseClient || window.supabase || null;
  }

  async getPublicData() {
    // Try to get client, retry a few times if missing
    for (let i = 0; i < 5; i++) {
      this.client = window.supabaseClient || window.supabase || this.client;
      if (this.client) break;
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    if (!this.client) return { scripts: [], groups: [] };
    try {
      const gr = await this.client.from('chat_groups_public').select('*').order('order_index', { ascending: true });
      const sr = await this.client.from('public_catalog').select('*').eq('is_active', true).order('order_index', { ascending: true });
      return {
        scripts: Array.isArray(sr.data) ? sr.data : [],
        groups: Array.isArray(gr.data) ? gr.data : []
      };
    } catch (error) {
      console.error('SupabaseAdapter: getPublicData failed.', error);
      return { scripts: [], groups: [] };
    }
  }

  async upsertPublicData(scripts, groups) {
    this.client = window.supabaseClient || window.supabase || this.client;
    if (!this.client) throw new Error('Supabase client not initialized');
    if (groups && groups.length) {
      const mappedGroups = groups.map(g => ({ id: g.id, name: g.name, color: g.color, order_index: g.order_index || 0 }));
      const { error } = await this.client.from('chat_groups_public').upsert(mappedGroups, { onConflict: 'id' });
      if (error) throw error;
    }
    if (scripts && scripts.length) {
      const mappedScripts = scripts.map(s => ({ id: s.id, group_id: s.groupId || null, title: s.title, note: s.note || '', content: s.content, order_index: s.order_index || 0, is_active: true }));
      const { error } = await this.client.from('public_catalog').upsert(mappedScripts, { onConflict: 'id' });
      if (error) throw error;
    }
  }

  async ping() {
    this.client = window.supabaseClient || window.supabase || this.client;
    if (!this.client) return { ok: false, error: 'client_not_initialized' };
    try {
      const { data, error } = await this.client.from('public_catalog').select('id').limit(1);
      if (error) return { ok: false, error: error.message || 'query_error' };
      return { ok: true, count: Array.isArray(data) ? data.length : 0 };
    } catch (e) {
      return { ok: false, error: e.message || 'exception' };
    }
  }
}


// --- Service ---

/**
 * StorageService
 * The main orchestrator for data operations.
 */
class StorageService {
  constructor() {
    this.local = new LocalAdapter();
    this.remote = new SupabaseAdapter();
    this.enableRemote = true;
  }

  /**
   * Loads initial data. This is the primary entry point for the application.
   * It fetches public data, then merges it with user data (from remote or local cache).
   */
  async load() {
    const publicData = this.enableRemote ? await this.remote.getPublicData() : { scripts: [], groups: [] };
    const userData = await this.local.getData();

    const normalizeScript = (script, source) => ({
      ...script,
      groupId: script.groupId ?? script.group_id ?? null,
      usageCount: script.usage_count ?? script.usageCount,
      __source: source
    });

    const dedupeScripts = (list) => {
      const indexMap = new Map();
      const result = [];

      list.forEach((script) => {
        const key = script.id || `${script.title || ''}::${script.content || ''}`;
        if (!key) {
          result.push(script);
          return;
        }
        if (!indexMap.has(key)) {
          indexMap.set(key, result.length);
          result.push(script);
          return;
        }
        const existingIndex = indexMap.get(key);
        const existing = result[existingIndex];
        if (existing.__source === 'public' && script.__source === 'private') {
          result[existingIndex] = script;
        }
      });

      return result;
    };

    const scripts = dedupeScripts([
      ...publicData.scripts.map(s => normalizeScript(s, 'public')),
      ...userData.scripts.map(s => normalizeScript(s, 'private'))
    ]);

    const groupMap = new Map();
    for (const g of publicData.groups) groupMap.set(g.id, { ...g, __source: 'public' });
    for (const g of userData.groups) groupMap.set(g.id, { ...(groupMap.get(g.id) || {}), ...g, __source: 'private' });

    const groups = Array.from(groupMap.values());
    return { scripts, groups };
  }

  /**
   * 保存脚本和分组到本地存储（不持久化公共库数据）。
   */
  async save(scripts, groups) {
    const privateScripts = (scripts || []).filter(s => s.__source !== 'public');
    const privateGroups = (groups || []).filter(g => g.__source !== 'public');

    await this.local.saveData(privateScripts, privateGroups);
  }

  async testConnection() {
    if (!this.enableRemote) return { ok: false, error: 'remote_disabled' };
    const ok = await (window.ensureSupabase ? window.ensureSupabase() : Promise.resolve(false));
    if (!ok) return { ok: false, error: 'not_configured' };
    return await this.remote.ping();
  }

  async publishAllToPublic(scripts, groups, token) {
    if ((token || '').trim() !== '123456') {
      return { success: false, error: new Error('Invalid token') };
    }
    const privateScripts = (scripts || []).filter(s => s.__source !== 'public');
    const privateGroups = (groups || []).filter(g => g.__source !== 'public');
    try {
      await this.remote.upsertPublicData(privateScripts, privateGroups);
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }
}

window.StorageService = StorageService;
