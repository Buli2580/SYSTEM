import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthSession } from './client';

const KEY = '@system/auth-session/v1';

export async function loadAuthSession(): Promise<AuthSession | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<AuthSession>;
    if (!value.accessToken || !value.refreshToken || !value.userId || !value.expiresAt) return null;
    return value as AuthSession;
  } catch { return null; }
}

export async function saveAuthSession(session: AuthSession): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(session));
}

export async function clearAuthSession(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
