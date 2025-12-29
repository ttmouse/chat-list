// console.log('[Supabase] supabase-client.js 脚本开始加载...');

// 硬编码配置（最高优先级，确保能用）
const HARDCODED_URL = 'https://noslltzmrhffjfatqlgh.supabase.co';
const HARDCODED_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc2xsdHptcmhmZmpmYXRxbGdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzOTIzMzcsImV4cCI6MjA3ODk2ODMzN30.sCI0LgBH4niNSQQdQoT_Bz218lml-Djux_M4GZR-yII';

// 初始化客户端
let client = null;

function getCreateClientSync() {
  const lib = window.supabase || window.Supabase;
  return lib && typeof lib.createClient === 'function' ? lib.createClient : null;
}

function initializeClient() {
  try {
    const createClient = getCreateClientSync();
    // console.log('[Supabase] createClient available:', !!createClient);

    if (createClient) {
      if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
        client = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
        // console.log('[Supabase] Client initialized with window config');
      } else if (HARDCODED_URL && HARDCODED_KEY) {
        client = createClient(HARDCODED_URL, HARDCODED_KEY);
        // console.log('[Supabase] Client initialized with hardcoded config');
      }
      window.supabaseClient = client;
      // console.log('[Supabase] window.supabaseClient set:', !!window.supabaseClient);
    } else {
      console.warn('[Supabase] createClient not available, will retry...');
    }
  } catch (e) {
    console.error('[Supabase] Initialization error:', e);
  }
}

// 立即尝试初始化
initializeClient();

// 如果失败，延迟重试（给 libs/supabase.js 时间加载）
if (!client) {
  setTimeout(() => {
    if (!window.supabaseClient) {
      // console.log('[Supabase] Retrying initialization...');
      initializeClient();
    }
  }, 100);
}

// 确保初始化的辅助函数
window.ensureSupabase = async function () {
  if (window.supabaseClient) return true;
  let createClient = getCreateClientSync();
  if (!createClient) {
    try {
      const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
      createClient = mod && typeof mod.createClient === 'function' ? mod.createClient : null;
    } catch (_) { }
  }
  if (!createClient) return false;
  let url = '';
  let key = '';
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const r = await chrome.storage.local.get(['SUPABASE_URL', 'SUPABASE_ANON_KEY']);
      url = (r.SUPABASE_URL || '').trim();
      key = (r.SUPABASE_ANON_KEY || '').trim();
    } else {
      url = (window.SUPABASE_URL || localStorage.getItem('SUPABASE_URL') || '').trim();
      key = (window.SUPABASE_ANON_KEY || localStorage.getItem('SUPABASE_ANON_KEY') || '').trim();
    }
  } catch (_) { }
  if (!url || !key) {
    url = HARDCODED_URL;
    key = HARDCODED_KEY;
  }
  if (!url || !key) {
    console.warn('supabase-client.js:28 \u26A0\uFE0F Supabase 客户端未初始化，请检查配置');
    return false;
  }
  window.supabaseClient = createClient(url, key);
  if (!window.supabase) window.supabase = window.supabaseClient;
  return true;
};