import AsyncStorage from '@react-native-async-storage/async-storage';
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

async function persistSession(session: CloudSession | null) {
  if (!session) {
    await AsyncStorage.removeItem(CLOUD_SESSION_STORAGE_KEY);
    return;
  }
  await AsyncStorage.setItem(CLOUD_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export async function loadStoredSession(): Promise<CloudSession | null> {
  const raw = await AsyncStorage.getItem(CLOUD_SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CloudSession>;
    if (
      typeof parsed.accessToken !== 'string' ||
      typeof parsed.refreshToken !== 'string' ||
      typeof parsed.expiresAt !== 'number' ||
      !parsed.user ||
      typeof parsed.user.id !== 'string'
    ) {
      await persistSession(null);
      return null;
    }
    return parsed as CloudSession;
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
  return refreshSession(session);
}

export async function signOutCloud(): Promise<void> {
  const session = await loadStoredSession();
  try {
    if (session) await cloudRequest('/auth/v1/logout', { method: 'POST' }, session.accessToken);
  } finally {
    await persistSession(null);
  }
}
