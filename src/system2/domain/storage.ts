import type { SQLiteDatabase } from 'expo-sqlite';
export type DomainState = {
  version: 1; playerId: string; name: string; level: number;
  completedQuests: number; nextLevelAt: number; firstAchievement: boolean;
  locations: Record<'COMMAND'|'ACADEMY'|'VAULT'|'FORGE'|'SANCTUARY', 'AVAILABLE'|'LOCKED'>;
};
/** Runs in the existing profile transaction; canonical completions own progression. */
export async function readDomain(db: Pick<SQLiteDatabase, 'getFirstAsync'|'getAllAsync'|'runAsync'>,
  playerId: string, displayName: string, onboarded: boolean): Promise<DomainState|null> {
  if (!onboarded) return null;
  const key = `living_domain_v1:${playerId}`;
  const row = await db.getFirstAsync<{value:string}>('SELECT value FROM app_state WHERE key=?', key);
  let name = `Azyl ${displayName.trim() || 'Przebudzonego'}`;
  if (row) {
    try {
      const saved = JSON.parse(row.value);
      if (saved.version !== 1 || saved.playerId !== playerId) throw new Error('Unsupported domain record');
      if (typeof saved.name === 'string' && saved.name.trim()) name = saved.name;
    } catch { throw new Error('Nie można odczytać domeny. Zachowano zapis; spróbuj ponownie.'); }
  }
  const count = await db.getFirstAsync<{count:number}>('SELECT COUNT(DISTINCT quest_id) AS count FROM quest_completions');
  const completedQuests = count?.count ?? 0;
  const level = 1 + Math.floor(completedQuests / 5);
  const state: DomainState = {version:1, playerId, name, level, completedQuests,
    nextLevelAt:level*5, firstAchievement:completedQuests>0,
    locations:{COMMAND:'AVAILABLE',ACADEMY:'AVAILABLE',VAULT:'AVAILABLE',FORGE:'LOCKED',SANCTUARY:'LOCKED'}};
  const encoded = JSON.stringify(state);
  if (row?.value !== encoded) await db.runAsync(
    'INSERT INTO app_state(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', key, encoded);
  return state;
}
