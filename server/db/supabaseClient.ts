import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || null;
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || null;

export let supabase: SupabaseClient | null = null;

export function initServerSupabase(url?: string, key?: string) {
  if (url) supabaseUrl = url;
  if (key) supabaseKey = key;

  if (supabaseUrl && supabaseKey) {
    try {
      supabase = createClient(supabaseUrl, supabaseKey);
      console.log('✅ Server Supabase connected successfully to:', supabaseUrl);
      return true;
    } catch (err) {
      console.warn('⚠️ Server Supabase connection error:', (err as Error).message);
    }
  }
  return false;
}

initServerSupabase();
