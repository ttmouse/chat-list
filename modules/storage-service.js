class LocalAdapter {
  async getData() {
    const r = await chrome.storage.local.get(['chatScripts', 'chatGroups']);
    return { scripts: Array.isArray(r.chatScripts) ? r.chatScripts : [], groups: Array.isArray(r.chatGroups) ? r.chatGroups : [] };
  }
  async saveData(scripts, groups) {
    await chrome.storage.local.set({ chatScripts: scripts, chatGroups: groups });
  }
  async updateUsage(scriptId, usageCount) {
    const r = await chrome.storage.local.get(['chatScripts']);
    const scripts = Array.isArray(r.chatScripts) ? r.chatScripts : [];
    const idx = scripts.findIndex(s => s.id === scriptId);
    if (idx >= 0) {
      scripts[idx].usageCount = usageCount;
      await chrome.storage.local.set({ chatScripts: scripts });
    }
  }
}

class SupabaseAdapter {
  constructor() {
    this.client = window.supabase;
  }
  async isReady() {
    if (!this.client) return false;
    try {
      const { data } = await this.client.auth.getUser();
      return !!data?.user?.id;
    } catch { return false; }
  }
  async getUserId() {
    const { data } = await this.client.auth.getUser();
    return data?.user?.id || null;
  }
  async getData() {
    const uid = await this.getUserId();
    if (!uid) return { scripts: [], groups: [] };
    const gr = await this.client.from('chat_groups_user').select('*').eq('user_id', uid).order('order_index', { ascending: true });
    const sr = await this.client.from('user_scripts').select('*').eq('user_id', uid).order('order_index', { ascending: true });
    return { scripts: Array.isArray(sr.data) ? sr.data : [], groups: Array.isArray(gr.data) ? gr.data : [] };
  }
  async getPublicData() {
    if (!this.client) return { scripts: [], groups: [] };
    const gr = await this.client.from('chat_groups_public').select('*').order('order_index', { ascending: true });
    const sr = await this.client.from('public_catalog').select('*').eq('is_active', true).order('order_index', { ascending: true });
    return { scripts: Array.isArray(sr.data) ? sr.data : [], groups: Array.isArray(gr.data) ? gr.data : [] };
  }
  async saveData(scripts, groups) {
    const uid = await this.getUserId();
    if (!uid) return;
    const gs = (groups || []).map(g => ({ ...g, user_id: uid }));
    const ss = (scripts || []).map(s => ({ ...s, user_id: uid }));
    if (gs.length) await this.client.from('chat_groups_user').upsert(gs, { onConflict: 'id' });
    if (ss.length) await this.client.from('user_scripts').upsert(ss, { onConflict: 'id' });
  }
  async updateUsage(scriptId, usageCount) {
    const uid = await this.getUserId();
    if (!uid) return;
    await this.client.from('user_scripts').update({ usage_count: usageCount }).eq('user_id', uid).eq('id', scriptId);
  }
}

class StorageService {
  constructor() { this.local = new LocalAdapter(); this.remote = new SupabaseAdapter(); }
  async load() {
    const publicData = await this.remote.getPublicData().catch(() => ({ scripts: [], groups: [] }));
    const ready = await this.remote.isReady();
    let userData = { scripts: [], groups: [] };
    if (ready) {
      try { userData = await this.remote.getData(); await this.local.saveData(userData.scripts, userData.groups); } catch {}
    } else {
      try { userData = await this.local.getData(); } catch {}
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
  async save(scripts, groups) {
    const privateScripts = (scripts || []).filter(s => s.__source !== 'public');
    const privateGroups = (groups || []).filter(g => g.__source !== 'public');
    await this.local.saveData(privateScripts, privateGroups);
    const ready = await this.remote.isReady();
    if (ready) { try { await this.remote.saveData(privateScripts, privateGroups); } catch {} }
  }
  async updateUsage(scriptId, usageCount) {
    await this.local.updateUsage(scriptId, usageCount);
    const ready = await this.remote.isReady();
    if (ready) { try { await this.remote.updateUsage(scriptId, usageCount); } catch {} }
  }
  async submitToPublic(payload) {
    const ready = await this.remote.isReady();
    const client = this.remote.client;
    const { publishToken } = await chrome.storage.local.get(['publishToken']);
    const row = { id: payload.id, token: publishToken || null, source_script_id: payload.source_script_id || null, payload: payload.payload, status: 'pending' };
    const res = await client.from('publish_requests').upsert(row, { onConflict: 'id' });
    return { data: res.data, error: res.error };
  }
}

window.StorageService = StorageService;