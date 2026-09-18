import { calculateAge } from '../identity/age';
import type { SQLiteDatabase } from 'expo-sqlite';
import { normalizePlayer, SKILL_KEYS } from '../core/progression';
import { getQuest } from '../quests/catalog';
import { parseSettings } from '../identity/model';
import { SCHEMA_VERSION } from './migrations';

export type HealthIssue = { code: string; entity?: string };
export type LocalHealth = { ok: boolean; issues: HealthIssue[]; schema: number | null };

/** Inspect raw persisted values, never normalize/save or reset a broken profile. No private payloads returned. */
export async function inspectLocalHealth(db: SQLiteDatabase): Promise<LocalHealth> {
  const issues: HealthIssue[] = [];
  const add = (code: string, entity?: string) => issues.push({ code, ...(entity ? { entity } : {}) });
  const schema = (await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version'))?.user_version ?? null;
  if (schema !== SCHEMA_VERSION) add('SCHEMA_VERSION');
  if ((await db.getFirstAsync<{ quick_check: string }>('PRAGMA quick_check'))?.quick_check !== 'ok') add('SQLITE_INTEGRITY');
  const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key,value FROM app_state');
  const state = new Map(rows.map(row => [row.key, row.value]));
  let player: ReturnType<typeof normalizePlayer> | undefined;
  if (!state.has('player')) add('PLAYER_MISSING');
  else try {
    const raw = JSON.parse(state.get('player')!);
    const normalized = normalizePlayer(raw);
    player = raw;
    if (raw.birthDate !== undefined && calculateAge(raw.birthDate) === null) add('BIRTH_DATE_INVALID');
    if (!raw.id.trim() || !raw.displayName.trim() || !Number.isFinite(Date.parse(raw.updatedAt))) add('PLAYER_IDENTITY');
    if (['realLevel','realXp','realXpToNextLevel','rank','avatarEvolution'].some(key => raw[key] !== normalized[key as keyof typeof normalized])) add('PLAYER_PROGRESSION');
    if (SKILL_KEYS.some(key => JSON.stringify(raw.stats[key]) !== JSON.stringify(normalized.stats[key]))) add('PLAYER_STATS');
    if (![raw.streak,raw.verifiedQuestCount,raw.gameEnergy,raw.discoveredSectors].every(n => Number.isSafeInteger(n) && n >= 0)) add('PLAYER_COUNTERS');
  } catch { add('PLAYER_INVALID'); }
  if (!['true','false'].includes(state.get('onboarding_complete') ?? '')) add('ONBOARDING_METADATA');
  try { parseSettings(state.get('settings')); } catch { add('SETTINGS_METADATA'); }
  for (const key of ['awakening_presentation_seen','avatar_cleanup_pending']) if (state.has(key) && !['true','false'].includes(state.get(key)!)) add('BOOLEAN_METADATA',key);
  if (state.has('last_known_wall_clock') && (!Number.isFinite(Number(state.get('last_known_wall_clock'))) || Number(state.get('last_known_wall_clock')) <= 0)) add('CLOCK_METADATA');
  for (const key of ['last_daily_day']) if (state.has(key) && (!/^\d{4}-\d{2}-\d{2}$/.test(state.get(key)!) || !Number.isFinite(Date.parse(state.get(key)!)))) add('DAY_METADATA',key);
  const completions = await db.getAllAsync<{ quest_id: string; completed_at: string }>('SELECT quest_id,completed_at FROM quest_completions');
  if (player && player.verifiedQuestCount !== completions.length) add('COMPLETION_COUNT');
  for (const row of completions) {
    const quest = getQuest(row.quest_id);
    if (!quest) add('QUEST_REFERENCE',row.quest_id);
    if (!Number.isFinite(Date.parse(row.completed_at))) add('COMPLETION_TIMESTAMP',row.quest_id);
    const event = await db.getFirstAsync<{ payload: string }>('SELECT payload FROM verified_events WHERE id=?','quest_'+row.quest_id);
    if (!event) add('COMPLETION_EVENT_MISSING',row.quest_id);
    else try {
      const data = JSON.parse(event.payload);
      if (data.id !== 'quest_'+row.quest_id || data.questId !== row.quest_id || data.playerId !== player?.id || data.verified !== true ||
          !Number.isFinite(Date.parse(data.createdAt)) || !Number.isSafeInteger(data.realXpAwarded) || data.realXpAwarded < 0 ||
          !Number.isSafeInteger(data.gameEnergyAwarded) || data.gameEnergyAwarded < 0 || !data.skillXpAwarded ||
          Object.entries(data.skillXpAwarded).some(([key,value]) => !SKILL_KEYS.includes(key as typeof SKILL_KEYS[number]) || !Number.isSafeInteger(value) || Number(value) < 0)) add('COMPLETION_EVENT_INVALID',row.quest_id);
    } catch { add('COMPLETION_EVENT_INVALID',row.quest_id); }
    if (quest?.category === 'DAILY' && !await db.getFirstAsync('SELECT id FROM daily_instances WHERE id=?',row.quest_id)) add('DAILY_REFERENCE',row.quest_id);
  }
  const duplicates = await db.getAllAsync<{ quest_id: string }>("SELECT quest_id FROM verified_events WHERE id LIKE 'quest_%' GROUP BY quest_id HAVING COUNT(*)>1");
  for (const row of duplicates) add('DUPLICATE_COMPLETION_EVENT',row.quest_id);
  const orphans = await db.getAllAsync<{ quest_id: string }>("SELECT e.quest_id FROM verified_events e LEFT JOIN quest_completions c ON c.quest_id=e.quest_id WHERE e.id LIKE 'quest_%' AND c.quest_id IS NULL");
  for (const row of orphans) add('EVENT_WITHOUT_COMPLETION',row.quest_id);
  const sets = await db.getAllAsync<{ day_key: string }>('SELECT s.day_key FROM daily_sets s LEFT JOIN daily_instances d ON d.day_key=s.day_key GROUP BY s.day_key HAVING COUNT(d.id)<>3');
  for (const row of sets) add('DAILY_SET_SIZE',row.day_key);
  const instances = await db.getAllAsync<{ id: string; template_id: string; day_key: string }>('SELECT id,template_id,day_key FROM daily_instances');
  for (const row of instances) {
    const q = getQuest(row.id);
    if (!q || q.templateId !== row.template_id || q.dayKey !== row.day_key || !await db.getFirstAsync('SELECT day_key FROM daily_sets WHERE day_key=?',row.day_key)) add('DAILY_INSTANCE_INVALID',row.id);
  }
  return { ok: issues.length === 0, issues, schema };
}
