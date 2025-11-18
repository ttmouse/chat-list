import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'YOUR_SUPABASE_URL'; 
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

// 优先从 window 对象获取，这允许在运行时动态注入配置，更灵活、更安全
const url = window.SUPABASE_URL || supabaseUrl;
const key = window.SUPABASE_ANON_KEY || supabaseAnonKey;

/**
 * Supabase 客户端实例
 */
export const supabase = createClient(url, key);

// 将客户端实例暴露到全局 window 对象，方便其他模块（如 storage-service）访问
window.supabase = supabase;