import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { CLOUD_SESSION_STORAGE_KEY } from './config';
import { cloudRequest } from './http';

export type CloudUser = {
  id: string;
  email?: string;
};

export type CloudSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: CloudUser;
};

type AuthPayload = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  user?: CloudUser;
  session?: {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    expires_at?: number;
    user?: CloudUser;
  } | null;
};

export type SignUpResult = {
  user: CloudUser | null;
  session: CloudSession | null;
  confirmationRequired: boolean;
};

let refreshPromise: Promise<CloudSession> | null = null;

function sessionFromPayload(payload: AuthPayload): CloudSession | null {
  const source = payload.session ?? payload;
  const accessToken = source.access_token;
  const refreshToken = source.refresh_token;
  const user = source.user ?? payload.user;
  if (!accessToken || !refreshToken || !user?.id) return null;

  const expiresAtSeconds = source.expires_at;
  const expiresInSeconds = source.expires_in ?? 3600;
  const expiresAt = expiresAtSeconds
    ? expiresAtSeconds * 1000
    : Date.now() + Math.max(60, expiresInSeconds) * 1000;

  return { accessToken, refreshToken, expiresAt, user };
}

function isValidStoredSession(parsed: unknown): parsed is CloudSession {
  if (!parsed || typeof parsed !== 'object') return false;
  const value = parsed as Partial<CloudSession>;
  return typeof value.accessToken === 'string' &&
    value.accessToken.length > 0 &&
    typeof value.refreshToken === 'string' &&
    value.refreshToken.length > 0 &&
    typeof value.expiresAt === 'number' &&
    Number.isFinite(value.expiresAt) &&
    Boolean(value.user) &&
    typeof value.user?.id === 'string' &&
    value.user.id.length > 0;
}

async function readSessionValue() {
  if (Platform.OS === 'web') return AsyncStorage.getItem(CLOUD_SESSION_STORAGE_KEY);

  const secure = await SecureStore.getItemAsync(CLOUD_SESSION_STORAGE_KEY);
  if (secure) return secure;

  // One-time migration from SYSTEM ONLINE 0.2/0.3 where tokens lived in AsyncStorage.
  const legacy = await AsyncStorage.getItem(CLOUD_SESSION_STORAGE_KEY);
  if (legacy) {
    await SecureStore.setItemAsync(CLOUD_SESSION_STORAGE_KEY, legacy);
    await AsyncStorage.removeItem(CLOUD_SESSION_STORAGE_KEY);
  }
  return legacy;
}

async function persistSession(session: CloudSession | null) {
  const value = session ? JSON.stringify(session) : null;
  if (Platform.OS === 'web') {
    if (value) await AsyncStorage.setItem(CLOUD_SESSION_STORAGE_KEY, value);
    else await AsyncStorage.removeItem(CLOUD_SESSION_STORAGE_KEY);
    return;
  }

  if (value) await SecureStore.setItemAsync(CLOUD_SESSION_STORAGE_KEY, value);
  else await SecureStore.deleteItemAsync(CLOUD_SESSION_STORAGE_KEY);

  // Never leave an old plaintext token after migration/sign-out.
  await AsyncStorage.removeItem(CLOUD_SESSION_STORAGE_KEY);
}

export async function loadStoredSession(): Promise<CloudSession | null> {
  const raw = await readSessionValue();
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isValidStoredSession(parsed)) {
      await persistSession(null);
      return null;
    }
    return parsed;
  } catch {
    await persistSession(null);
    return null;
  }
}

export async function signUpWithPassword(
  email: string,
  password: string,
  displayName: string,
): Promise<SignUpResult> {
  const safeEmail = email.trim().toLowerCase();
  if (!safeEmail || !safeEmail.includes('@')) throw new Error('Podaj poprawny e-mail.');
  if (password.length < 8) throw new Error('Hasło musi mieć co najmniej 8 znaków.');

  const locale = Intl.DateTimeFormat().resolvedOptions().locale || 'pl';
  const payload = await cloudRequest<AuthPayload>('/auth/v1/signup', {
    method: 'POST',
    body: JSON.stringify({
      email: safeEmail,
      password,
      data: { display_name: displayName.trim().slice(0, 40), locale: locale.slice(0, 16) },
    }),
  });

  const session = sessionFromPayload(payload);
  if (session) await persistSession(session);
  return {
    user: payload.user ?? session?.user ?? null,
    session,
    confirmationRequired: !session,
  };
}

export async function signInWithPassword(email: string, password: string): Promise<CloudSession> {
  const payload = await cloudRequest<AuthPayload>('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });
  const session = sessionFromPayload(payload);
  if (!session) throw new Error('SYSTEM CLOUD nie zwrócił sesji.');
  await persistSession(session);
  return session;
}

async function refreshSession(session: CloudSession): Promise<CloudSession> {
  const payload = await cloudRequest<AuthPayload>('/auth/v1/token?grant_type=refresh_token', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: session.refreshToken }),
  });
  const refreshed = sessionFromPayload(payload);
  if (!refreshed) {
    await persistSession(null);
    throw new Error('Sesja SYSTEM CLOUD wygasła. Zaloguj się ponownie.');
  }
  await persistSession(refreshed);
  return refreshed;
}

export async function getValidSession(): Promise<CloudSession | null> {
  const session = await loadStoredSession();
  if (!session) return null;
  if (session.expiresAt - Date.now() > 120_000) return session;

  if (!refreshPromise) {
    refreshPromise = refreshSession(session).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function signOutCloud(): Promise<void> {
  const session = await loadStoredSession();
  try {
    if (session) await cloudRequest('/auth/v1/logout', { method: 'POST' }, session.accessToken);
  } finally {
    refreshPromise = null;
    await persistSession(null);
  }
}
