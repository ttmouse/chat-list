/**
 * Storage Service Module
 * 
 * Implements the data access layer as described in the Supabase storage design document.
 * This service orchestrates data between a local cache (Chrome Storage) and a remote
 * Supabase backend. It includes robust synchronization logic (pull/push), offline
 * capabilities, and data merging.
 */

// --- Adapters ---

/**
 * LocalAdapter
 * Wraps chrome.storage.local to provide a consistent async interface for local data persistence.
 */
class LocalAdapter {
  async get(keys) {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        return await chrome.storage.local.get(keys);
      }
      const res = {};
      keys.forEach(k => { res[k] = localStorage.getItem(k) || ''; });
      return res;
    } catch (error) {
      console.error('LocalAdapter: Failed to get data.', error);
      const res = {};
      keys.forEach(k => { res[k] = localStorage.getItem(k) || ''; });
      return res;
    }
  }

  async set(data) {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set(data);
        return;
      }
      Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, v ?? ''));
    } catch (error) {
      console.error('LocalAdapter: Failed to set data.', error);
      Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, v ?? ''));
    }
  }

  /**
   * Sets the sync password.
   * Hashes the password to generate a deterministic User ID.
   */
  async setSyncPassword(password) {
    if (!password) return;

    // Simple hash function to generate a deterministic ID from password
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Use the first 32 chars of hash to form a UUID-like string
    // Format: 8-4-4-4-12
    const uuid = `${hashHex.slice(0, 8)}-${hashHex.slice(8, 12)}-${hashHex.slice(12, 16)}-${hashHex.slice(16, 20)}-${hashHex.slice(20, 32)}`;

    await this.set({ guestUserId: uuid });
    return uuid;
  }

  async getGuestId() {
    const { guestUserId } = await this.get(['guestUserId']);
    return guestUserId || null;
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
    this.local = new LocalAdapter(); // Need access to local storage for guest ID
  }

  async isReady() {
    // Ready if we have a guest ID (derived from password)
    const uid = await this.local.getGuestId();
    return !!uid;
  }

  async getUserId() {
    // Priority: Password-derived ID -> Supabase Auth
    const guestId = await this.local.getGuestId();
    if (guestId) return guestId;

    this.client = window.supabaseClient || window.supabase || this.client;
    if (this.client && this.client.auth) {
      try {
        const { data } = await this.client.auth.getUser();
        if (data?.user?.id) return data.user.id;
      } catch (_) { }
    }
    return null;
  }

  async getPublicData() {
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

  /**
   * Fetches all user data. Used for initial sync.
   */
  async getAllUserData() {
    const uid = await this.getUserId();
    if (!uid) return { scripts: [], groups: [] };
    try {
      const gr = await this.client.from('chat_groups_user').select('*').eq('user_id', uid);
      const sr = await this.client.from('user_scripts').select('*').eq('user_id', uid);
      return {
        scripts: Array.isArray(sr.data) ? sr.data : [],
        groups: Array.isArray(gr.data) ? gr.data : []
      };
    } catch (_) {
      return { scripts: [], groups: [] };
    }
  }

  /**
   * Fetches user data that has been updated since the given timestamp.
   */
  async getUpdatedUserData(timestamp) {
    const uid = await this.getUserId();
    if (!uid) return { scripts: [], groups: [] };
    try {
      const gr = await this.client.from('chat_groups_user').select('*').eq('user_id', uid).gt('updated_at', timestamp);
      const sr = await this.client.from('user_scripts').select('*').eq('user_id', uid).gt('updated_at', timestamp);
      return {
        scripts: Array.isArray(sr.data) ? sr.data : [],
        groups: Array.isArray(gr.data) ? gr.data : []
      };
    } catch (_) {
      return { scripts: [], groups: [] };
    }
  }

  /**
   * Upserts scripts and groups for the current user.
   */
  async upsertUserData(scripts, groups) {
    const uid = await this.getUserId();
    if (!uid) throw new Error("User not authenticated.");

    try {
      if (groups && groups.length) {
        const groupsToUpsert = groups.map(g => ({ ...g, user_id: uid }));
        const { error } = await this.client.from('chat_groups_user').upsert(groupsToUpsert, { onConflict: 'id' });
        if (error) throw error;
      }
      if (scripts && scripts.length) {
        const scriptsToUpsert = scripts.map(s => ({ ...s, user_id: uid }));
        const { error } = await this.client.from('user_scripts').upsert(scriptsToUpsert, { onConflict: 'id' });
        if (error) throw error;
      }
    } catch (error) {
      console.error('SupabaseAdapter: upsertUserData failed.', error);
      throw error;
    }
  }

  async submitToPublic(payload) {
    try {
      const row = {
        id: payload.id,
        user_id: null,
        source_script_id: payload.source_script_id || null,
        payload: payload.payload,
        status: 'pending'
      };
      const { data, error } = await this.client.from('publish_requests').upsert(row, { onConflict: 'id' });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('SupabaseAdapter: submitToPublic failed.', error);
      return { data: null, error };
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
    this.syncQueue = [];
    this.isSyncing = false;
    this.enableRemote = true;
  }

  /**
   * Loads initial data. This is the primary entry point for the application.
   * It fetches public data, then merges it with user data (from remote or local cache).
   */
  async load() {
    const publicData = this.enableRemote ? await this.remote.getPublicData() : { scripts: [], groups: [] };
    const ready = this.enableRemote ? await this.remote.isReady() : false;
    let userData = { scripts: [], groups: [] };

    if (ready) {
      // User is logged in, perform a sync.
      userData = await this.syncPull();
    } else {
      // User is not logged in, load from local cache.
      userData = await this.local.getData();
    }

    const scripts = [
      ...publicData.scripts.map(s => ({ ...s, __source: 'public', usageCount: s.usage_count ?? s.usageCount })),
      ...userData.scripts.map(s => ({ ...s, __source: 'private', usageCount: s.usage_count ?? s.usageCount }))
    ];

    const groupMap = new Map();
    for (const g of publicData.groups) groupMap.set(g.id, { ...g, __source: 'public' });
    for (const g of userData.groups) groupMap.set(g.id, { ...(groupMap.get(g.id) || {}), ...g, __source: 'private' });

    const groups = Array.from(groupMap.values());
    return { scripts, groups };
  }

  /**
   * Pulls data from remote and merges it with local data.
   * If no last sync timestamp is found, performs a full fetch.
   * Otherwise, performs an incremental fetch.
   */
  async syncPull() {
    if (!this.enableRemote || !(await this.remote.isReady())) {
      const localData = await this.local.getData();
      return { scripts: localData.scripts, groups: localData.groups };
    }
    const { lastSyncTimestamp } = await this.local.get(['lastSyncTimestamp']);
    const remoteData = lastSyncTimestamp
      ? await this.remote.getUpdatedUserData(lastSyncTimestamp)
      : await this.remote.getAllUserData();

    let localData = await this.local.getData();

    // Merge remote changes into local data (Last Write Wins)
    const merge = (localItems, remoteItems) => {
      const itemMap = new Map(localItems.map(item => [item.id, item]));
      remoteItems.forEach(remoteItem => {
        const localItem = itemMap.get(remoteItem.id);
        if (!localItem || new Date(remoteItem.updated_at) > new Date(localItem.updated_at)) {
          itemMap.set(remoteItem.id, remoteItem);
        }
      });
      return Array.from(itemMap.values());
    };

    const mergedScripts = merge(localData.scripts, remoteData.scripts);
    const mergedGroups = merge(localData.groups, remoteData.groups);

    await this.local.saveData(mergedScripts, mergedGroups);
    await this.local.set({ lastSyncTimestamp: new Date().toISOString() });

    return { scripts: mergedScripts, groups: mergedGroups };
  }

  /**
   * Saves scripts and groups. Data is saved locally immediately,
   * and the remote save is added to a queue to be processed asynchronously.
   */
  async save(scripts, groups) {
    const privateScripts = (scripts || []).filter(s => s.__source !== 'public');
    const privateGroups = (groups || []).filter(g => g.__source !== 'public');

    // Save to local immediately for responsiveness
    await this.local.saveData(privateScripts, privateGroups);

    // Add to sync queue for remote push
    if (this.enableRemote && await this.remote.isReady()) {
      this.queuePush({ type: 'upsert', scripts: privateScripts, groups: privateGroups });
    }
  }

  /**
   * Queues a change to be pushed to the remote.
   */
  async queuePush(change) {
    const { syncQueue = [] } = await this.local.get(['syncQueue']);
    syncQueue.push({ ...change, id: Date.now() });
    await this.local.set({ syncQueue });
    this.processSyncQueue(); // Fire-and-forget
  }

  /**
   * Processes the sync queue, pushing changes to the remote.
   * Implements a simple retry mechanism.
   */
  async processSyncQueue() {
    if (!this.enableRemote) return;
    if (this.isSyncing) return;
    this.isSyncing = true;

    const { syncQueue = [] } = await this.local.get(['syncQueue']);
    if (syncQueue.length === 0) {
      this.isSyncing = false;
      return;
    }

    const change = syncQueue[0];

    try {
      if (change.type === 'upsert') {
        await this.remote.upsertUserData(change.scripts, change.groups);
      }
      // Remove successful change from queue
      syncQueue.shift();
      await this.local.set({ syncQueue });
    } catch (error) {
      console.error('StorageService: Failed to process sync queue item.', error);
      // Simple retry: move failed item to the back of the queue
      syncQueue.push(syncQueue.shift());
      await this.local.set({ syncQueue });
    } finally {
      this.isSyncing = false;
      // If there are more items, process them
      if (syncQueue.length > 0) {
        setTimeout(() => this.processSyncQueue(), 1000); // Process next with a small delay
      }
    }
  }

  async submitToPublic(payload) {
    if (!this.enableRemote) {
      return { data: null, error: new Error('Remote disabled') };
    }
    try {
      return await this.remote.submitToPublic(payload);
    } catch (error) {
      console.error('StorageService: submitToPublic failed.', error);
      return { data: null, error };
    }
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
