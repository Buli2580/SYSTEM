import { getValidSession } from './auth';
import { cloudRequest } from './http';

export type SocialVisibility = 'private' | 'public';

export type SocialProfile = {
  user_id: string;
  handle: string | null;
  public_name: string | null;
  bio: string | null;
  visibility: SocialVisibility;
  continent_code: string | null;
  country_code: string | null;
  region_code: string | null;
  city_label: string | null;
  real_level: number;
  rank: string;
  real_total_xp: number;
  follower_count: number;
  following_count: number;
};

export type LeaderboardEntry = {
  rank_position: number;
  user_id: string;
  handle: string | null;
  public_name: string | null;
  real_level: number;
  rank: string;
  real_total_xp: number;
  follower_count: number;
  continent_code: string | null;
  country_code: string | null;
  region_code: string | null;
  city_label: string | null;
};

async function requireSession() {
  const session = await getValidSession();
  if (!session) throw new Error('Najpierw zaloguj SYSTEM CLOUD.');
  return session;
}

export async function getMySocialProfile(): Promise<SocialProfile> {
  const session = await requireSession();
  const rows = await cloudRequest<SocialProfile[]>(
    '/rest/v1/social_profiles?user_id=eq.' + encodeURIComponent(session.user.id) + '&select=*',
    { method: 'GET' },
    session.accessToken,
  );
  if (!rows[0]) throw new Error('Nie znaleziono profilu społecznościowego.');
  return rows[0];
}

export async function updateMySocialProfile(patch: {
  handle?: string | null;
  public_name?: string | null;
  bio?: string | null;
  visibility?: SocialVisibility;
  continent_code?: string | null;
  country_code?: string | null;
  region_code?: string | null;
  city_label?: string | null;
}): Promise<SocialProfile> {
  const session = await requireSession();
  const body = {
    ...patch,
    ...(patch.handle !== undefined ? { handle: patch.handle?.trim().toLowerCase() || null } : {}),
    ...(patch.continent_code !== undefined ? { continent_code: patch.continent_code?.trim().toUpperCase() || null } : {}),
    ...(patch.country_code !== undefined ? { country_code: patch.country_code?.trim().toUpperCase() || null } : {}),
  };
  const rows = await cloudRequest<SocialProfile[]>(
    '/rest/v1/social_profiles?user_id=eq.' + encodeURIComponent(session.user.id) + '&select=*',
    {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(body),
    },
    session.accessToken,
  );
  if (!rows[0]) throw new Error('Nie udało się zapisać profilu społecznościowego.');
  return rows[0];
}

export async function getLeaderboard(
  scope: 'WORLD' | 'CONTINENT' | 'COUNTRY' | 'REGION' | 'CITY' = 'WORLD',
  scopeValue: string | null = null,
  limit = 20,
): Promise<LeaderboardEntry[]> {
  const session = await requireSession();
  return cloudRequest<LeaderboardEntry[]>('/rest/v1/rpc/get_leaderboard', {
    method: 'POST',
    body: JSON.stringify({
      p_scope: scope,
      p_scope_value: scopeValue,
      p_limit: Math.max(1, Math.min(limit, 100)),
    }),
  }, session.accessToken);
}

export async function followPlayer(userId: string): Promise<void> {
  const session = await requireSession();
  if (userId === session.user.id) throw new Error('Nie możesz obserwować własnego profilu.');
  await cloudRequest('/rest/v1/follows', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ follower_id: session.user.id, followed_id: userId }),
  }, session.accessToken);
}

export async function searchPlayers(query: string, limit = 20): Promise<SocialProfile[]> {
  const session = await requireSession();
  const term = query.trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24);
  if (term.length < 2) return [];
  return cloudRequest<SocialProfile[]>('/rest/v1/rpc/search_players', {
    method: 'POST',
    body: JSON.stringify({ p_query: term, p_limit: Math.max(1, Math.min(limit, 50)) }),
  }, session.accessToken);
}

export async function getFollowingIds(): Promise<string[]> {
  const session = await requireSession();
  const rows = await cloudRequest<{ followed_id: string }[]>(
    '/rest/v1/follows?follower_id=eq.' + encodeURIComponent(session.user.id) + '&select=followed_id&limit=500',
    { method: 'GET' },
    session.accessToken,
  );
  return rows.map(row => row.followed_id);
}

export async function unfollowPlayer(userId: string): Promise<void> {
  const session = await requireSession();
  const query = '?follower_id=eq.' + encodeURIComponent(session.user.id) +
    '&followed_id=eq.' + encodeURIComponent(userId);
  await cloudRequest('/rest/v1/follows' + query, { method: 'DELETE' }, session.accessToken);
}
