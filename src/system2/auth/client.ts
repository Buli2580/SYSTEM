import { cloudRequest, type SupabaseCloudConfig, type SupabaseSession } from '../cloud/http';

type AuthUser = { id: string; email?: string };
type AuthResponse = { access_token: string; refresh_token: string; expires_in: number; user: AuthUser };

export interface AuthSession extends SupabaseSession {
  refreshToken: string;
  expiresAt: number;
  email?: string;
}

async function authRequest<T>(config: SupabaseCloudConfig, path: string, body: unknown): Promise<T> {
  const response = await fetch(`${config.url}/auth/v1/${path}`, {
    method: 'POST',
    headers: { apikey: config.publishableKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || 'Authentication failed.');
  return JSON.parse(text) as T;
}

function sessionOf(value: AuthResponse): AuthSession {
  return { accessToken: value.access_token, refreshToken: value.refresh_token,
    expiresAt: Date.now() + value.expires_in * 1000, userId: value.user.id, email: value.user.email };
}

export async function signInWithPassword(config: SupabaseCloudConfig, email: string, password: string): Promise<AuthSession> {
  return sessionOf(await authRequest<AuthResponse>(config, 'token?grant_type=password', { email: email.trim(), password }));
}

export async function signUpWithPassword(config: SupabaseCloudConfig, email: string, password: string): Promise<AuthSession | null> {
  const value = await authRequest<Partial<AuthResponse> & { user: AuthUser }>(config, 'signup', { email: email.trim(), password });
  return value.access_token && value.refresh_token && value.expires_in
    ? sessionOf(value as AuthResponse) : null;
}

export async function refreshAuthSession(config: SupabaseCloudConfig, refreshToken: string): Promise<AuthSession> {
  return sessionOf(await authRequest<AuthResponse>(config, 'token?grant_type=refresh_token', { refresh_token: refreshToken }));
}

export async function signOut(config: SupabaseCloudConfig, session: AuthSession): Promise<void> {
  await cloudRequest<void>(config, session, '/auth/v1/logout', { method: 'POST' });
}
