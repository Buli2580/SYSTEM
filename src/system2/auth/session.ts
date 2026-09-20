import { cloudConfigFromEnv } from '../cloud/config';
import { refreshAuthSession, type AuthSession } from './client';
import { clearAuthSession, loadAuthSession, saveAuthSession } from './sessionStore';

const REFRESH_EARLY_MS = 60_000;

export async function validAuthSession(): Promise<AuthSession | null> {
  const config = cloudConfigFromEnv();
  if (!config) return null;
  const current = await loadAuthSession();
  if (!current) return null;
  if (current.expiresAt - Date.now() > REFRESH_EARLY_MS) return current;
  try {
    const next = await refreshAuthSession(config, current.refreshToken);
    await saveAuthSession(next);
    return next;
  } catch {
    await clearAuthSession();
    return null;
  }
}
