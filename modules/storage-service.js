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
      return await chrome.storage.local.get(keys);
    } catch (error) {
      console.error('LocalAdapter: Failed to get data.', error);
      return {};
    }
  }

  async set(data) {
    try {
      await chrome.storage.local.set(data);
    } catch (error) {
      console.error('LocalAdapter: Failed to set data.', error);
    }
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
    this.client = window.supabase;
  }

  async isReady() {
    if (!this.client) return false;
    try {
      const { data } = await this.client.auth.getUser();
      return !!data?.user?.id;
    } catch (error) {
      console.error('SupabaseAdapter: isReady check failed.', error);
      return false;
    }
  }

  async getUserId() {
    try {
      const { data } = await this.client.auth.getUser();
      return data?.user?.id || null;
    } catch (error) {
      console.error('SupabaseAdapter: getUserId failed.', error);
      return null;
    }
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
    } catch (error) {
      console.error('SupabaseAdapter: getAllUserData failed.', error);
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
    } catch (error) {
      console.error('SupabaseAdapter: getUpdatedUserData failed.', error);
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
    const { data: { user } } = await this.client.auth.getUser();
    if (!user) throw new Error("User not authenticated.");

    try {
      const row = {
        id: payload.id,
        user_id: user.id,
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
  }

  /**
   * Loads initial data. This is the primary entry point for the application.
   * It fetches public data, then merges it with user data (from remote or local cache).
   */
  async load() {
    const publicData = await this.remote.getPublicData();
    const ready = await this.remote.isReady();
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
    if (await this.remote.isReady()) {
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
    try {
      return await this.remote.submitToPublic(payload);
    } catch (error) {
      console.error('StorageService: submitToPublic failed.', error);
      return { data: null, error };
    }
  }
}

window.StorageService = StorageService;
