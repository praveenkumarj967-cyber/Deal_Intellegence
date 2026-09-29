import { createClient, SupabaseClient } from '@supabase/supabase-js';

export let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://grdlsieksrtdbzhmfelr.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZGxzaWVrc3J0ZGJ6aG1mZWxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDY4MTUzMywiZXhwIjoyMTA2MjU3NTMzfQ.4L8_hJWFJ6zHCRiK_eey1sLHBzpCRJ1wv9adMZc6xpg';

  if (url && key) {
    if (!supabase) {
      try {
        supabase = createClient(url, key);
        console.log('✅ Server Supabase connected successfully to:', url);
      } catch (err) {
        console.warn('⚠️ Server Supabase connection error:', (err as Error).message);
      }
    }
    return supabase;
  }
  return null;
}

export function initServerSupabase(url?: string, key?: string) {
  if (url && key) {
    try {
      supabase = createClient(url, key);
      console.log('✅ Server Supabase connected successfully to:', url);
      return true;
    } catch (err) {
      console.warn('⚠️ Server Supabase connection error:', (err as Error).message);
    }
  }
  return getSupabaseClient() !== null;
}

initServerSupabase();
