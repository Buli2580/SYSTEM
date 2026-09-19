import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './config';

const CLOUD_REQUEST_TIMEOUT_MS = 15_000;

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

  const controller = init.signal ? null : new AbortController();
  const timeout = controller
    ? setTimeout(() => controller.abort(), CLOUD_REQUEST_TIMEOUT_MS)
    : null;

  try {
    const response = await fetch(SUPABASE_URL + path, {
      ...init,
      headers,
      signal: init.signal ?? controller?.signal,
    });
    const text = await response.text();
    let payload: unknown = null;
    if (text) {
      try { payload = JSON.parse(text); } catch { payload = text; }
    }

    if (!response.ok) {
      const code = payload && typeof payload === 'object'
        ? String((payload as Record<string, unknown>).code ?? '')
        : undefined;
      throw new CloudRequestError(
        errorMessage(payload, 'Żądanie SYSTEM CLOUD nie powiodło się.'),
        response.status,
        code || undefined,
      );
    }

    return payload as T;
  } catch (cause) {
    if (cause instanceof CloudRequestError) throw cause;
    if (cause instanceof Error && cause.name === 'AbortError') {
      throw new CloudRequestError('SYSTEM CLOUD nie odpowiedział na czas.', 0, 'TIMEOUT');
    }
    throw new CloudRequestError('Brak połączenia z SYSTEM CLOUD.', 0, 'NETWORK_ERROR');
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
