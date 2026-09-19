import Constants from 'expo-constants';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;
let initError: string | null = null;

function getConfig() {
  const manifest = Constants.expoConfig ?? {};
  const extra = (manifest as any).extra ?? {};
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra.EXPO_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? extra.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';
  return { url, key };
}

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const { url, key } = getConfig();
  if (!url || !key) {
    initError = 'Supabase config missing: EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY';
    return null;
  }

  try {
    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
      realtime: {
        params: { eventsPerSecond: 5 },
      },
    });
    initError = null;
    return supabaseInstance;
  } catch (cause) {
    initError = cause instanceof Error ? cause.message : 'Failed to create Supabase client';
    return null;
  }
}

export function getSupabaseInitError(): string | null {
  return initError;
}

export function resetSupabaseClient(): void {
  supabaseInstance = null;
  initError = null;
}