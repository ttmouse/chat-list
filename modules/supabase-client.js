import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

const url = window.SUPABASE_URL || supabaseUrl;
const key = window.SUPABASE_ANON_KEY || supabaseAnonKey;

export const supabase = createClient(url, key);
window.supabase = supabase;
