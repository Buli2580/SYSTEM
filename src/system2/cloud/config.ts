import type { SupabaseCloudConfig } from './http';

export function cloudConfigFromEnv(): SupabaseCloudConfig | null {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !publishableKey) return null;
  if (!url.startsWith('https://')) throw new Error('EXPO_PUBLIC_SUPABASE_URL must use HTTPS.');
  return { url: url.replace(/\/$/, ''), publishableKey };
}
