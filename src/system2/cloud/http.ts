import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './config';

export class CloudRequestError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'CloudRequestError';
    this.status = status;
    this.code = code;
  }
}

function errorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object') return fallback;
  const row = payload as Record<string, unknown>;
  const value = row.msg ?? row.message ?? row.error_description ?? row.error ?? row.code;
  return typeof value === 'string' && value ? value : fallback;
}

export async function cloudRequest<T>(
  path: string,
  init: RequestInit = {},
  accessToken?: string,
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('apikey', SUPABASE_PUBLISHABLE_KEY);
  headers.set('Accept', 'application/json');
  if (init.body !== undefined && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', 'Bearer ' + accessToken);

  const response = await fetch(SUPABASE_URL + path, { ...init, headers });
  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try { payload = JSON.parse(text); } catch { payload = text; }
  }

  if (!response.ok) {
    const code = payload && typeof payload === 'object'
      ? String((payload as Record<string, unknown>).code ?? '')
      : undefined;
    throw new CloudRequestError(errorMessage(payload, 'SYSTEM CLOUD request failed.'), response.status, code || undefined);
  }

  return payload as T;
}
