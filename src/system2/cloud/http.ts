export interface SupabaseCloudConfig {
  url: string;
  publishableKey: string;
}

export interface SupabaseSession {
  accessToken: string;
  userId: string;
}

export class CloudHttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function cloudRequest<T>(
  config: SupabaseCloudConfig,
  session: SupabaseSession,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${config.url}${path}`, {
    ...init,
    headers: {
      apikey: config.publishableKey,
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  if (!response.ok) throw new CloudHttpError(response.status, text || response.statusText);
  return text ? JSON.parse(text) as T : (undefined as T);
}
