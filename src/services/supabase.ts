import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getEnvUrl = () => {
  const env = (import.meta as any).env || {};
  return env.VITE_SUPABASE_URL || localStorage.getItem('NEXUS_SUPABASE_URL') || '';
};

const getEnvKey = () => {
  const env = (import.meta as any).env || {};
  return env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('NEXUS_SUPABASE_ANON_KEY') || '';
};

export let supabaseFrontend: SupabaseClient | null = null;

export const initFrontendSupabase = (url?: string, key?: string) => {
  const finalUrl = url || getEnvUrl();
  const finalKey = key || getEnvKey();

  if (finalUrl && finalKey) {
    try {
      supabaseFrontend = createClient(finalUrl, finalKey, {
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });
      console.log('✅ Realtime Supabase Frontend Client initialized:', finalUrl);
      return supabaseFrontend;
    } catch (err) {
      console.warn('Failed to init Supabase client:', (err as Error).message);
    }
  }
  return null;
};

initFrontendSupabase();
