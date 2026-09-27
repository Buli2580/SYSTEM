import type { SQLiteDatabase } from 'expo-sqlite';
import type { PlayerProfile, Quest, VerifiedEvent } from '../core/types';
import { applyQuestRewards } from '../core/questEngine';
import { dayKey, weekKey, DAILY_RULES } from '../daily/calendar';
import { calculateStreakState, getMilestoneReward, STREAK_MILESTONES, type StreakMilestone, type StreakState } from '../daily/streak';
import { getActiveWeeklyChallenges, getWeeklyChallengeStatus, type WeeklyChallenge } from '../weekly/challenges';
import type { QuestEvidence } from '../quests/types';

type Transaction = Pick<SQLiteDatabase, 'getFirstAsync' | 'getAllAsync' | 'runAsync'>;
export const PROGRESSION_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS progression_contributions (
  player_id TEXT NOT NULL, event_key TEXT NOT NULL, quest_id TEXT NOT NULL,
  day_key TEXT NOT NULL, week_key TEXT NOT NULL, daily INTEGER NOT NULL CHECK(daily IN (0,1)),
  distance REAL NOT NULL CHECK(distance>=0), created_at TEXT NOT NULL,
  PRIMARY KEY(player_id,event_key), UNIQUE(player_id,quest_id)
);
CREATE INDEX IF NOT EXISTS progression_week ON progression_contributions(player_id,week_key);
CREATE TABLE IF NOT EXISTS progression_claims (
  player_id TEXT NOT NULL, claim_key TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN ('MILESTONE','WEEKLY')),
  reward_xp INTEGER NOT NULL CHECK(reward_xp>=0), reward_energy INTEGER NOT NULL CHECK(reward_energy>=0),
  created_at TEXT NOT NULL, PRIMARY KEY(player_id,claim_key)
);`;
export type PersistedWeeklyChallenge = WeeklyChallenge & { percentComplete: number; rewardClaimed: boolean };
export type ProgressionState = {
  streak: StreakState; weekKey: string; weeklyChallenges: PersistedWeeklyChallenge[];
  claimedMilestones: StreakMilestone[]; clockAnomaly: boolean;
};
function checkedDay(now: string) {
  const timestamp = Date.parse(now);
  if (!Number.isFinite(timestamp)) throw new Error('Invalid progression date.');
  return dayKey(timestamp);
}
async function playerId(txn: Transaction): Promise<string | null> {
  const row = await txn.getFirstAsync<{ value: string }>('SELECT value FROM app_state WHERE key=?', 'player');
  if (!row) return null;
  const profile = JSON.parse(row.value) as { id?: unknown };
  return typeof profile.id === 'string' && profile.id.length ? profile.id : null;
}
async function readForPlayer(txn: Transaction, id: string | null, now: string): Promise<ProgressionState> {
  const today = checkedDay(now), week = weekKey(today);
  const latest = await txn.getFirstAsync<{ period_key: string; streak: number }>(
    "SELECT period_key,streak FROM protocol_bonuses WHERE kind='daily_clear' ORDER BY period_key DESC LIMIT 1");
  const best = await txn.getFirstAsync<{ n: number }>("SELECT COALESCE(MAX(streak),0) n FROM protocol_bonuses WHERE kind='daily_clear'");
  const streak = calculateStreakState(latest?.streak ?? 0, best?.n ?? 0, latest?.period_key ?? null, today,
    { clear: latest?.period_key === today });
  const totals = await txn.getFirstAsync<{ quests: number; days: number; meters: number }>(
    'SELECT COUNT(*) quests,COUNT(DISTINCT CASE WHEN daily=1 THEN day_key END) days,COALESCE(SUM(distance),0) meters FROM progression_contributions WHERE player_id=? AND week_key=?', id ?? '', week);
  const highDay = await txn.getFirstAsync<{ day: string | null }>('SELECT MAX(day_key) day FROM progression_contributions WHERE player_id=?', id ?? '');
  const clock = await txn.getFirstAsync<{ value: string }>('SELECT value FROM app_state WHERE key=?', 'last_known_wall_clock');
  const clockAnomaly = streak.clockAnomaly || Boolean(highDay?.day && highDay.day > today)
    || Date.parse(now) < Number(clock?.value ?? 0) - DAILY_RULES.clockToleranceMs;
  const rows = await txn.getAllAsync<{ claim_key: string }>('SELECT claim_key FROM progression_claims WHERE player_id=?', id ?? '');
  const claims = new Set(rows.map(row => row.claim_key));
  const progress: Record<string, number> = {
    weekly_quest_master: totals?.quests ?? 0, weekly_daily_consistency: totals?.days ?? 0,
    weekly_pathfinder: totals?.meters ?? 0, weekly_streak_keeper: streak.currentStreak,
  };
  const weeklyChallenges = getActiveWeeklyChallenges(week).map(challenge => {
    const view = getWeeklyChallengeStatus(challenge, week, progress);
    const rewardClaimed = claims.has(`weekly:${week}:${challenge.id}`);
    return { ...challenge, progress: rewardClaimed ? Math.max(challenge.target, view.currentProgress) : view.currentProgress, percentComplete: rewardClaimed ? 100 : view.percentComplete,
      status: rewardClaimed ? 'COMPLETED' as const : view.status, rewardClaimed };
  });
  return { streak, weekKey: week, weeklyChallenges,
    claimedMilestones: STREAK_MILESTONES.filter(m => claims.has('milestone:' + m)), clockAnomaly };
}
/** Read persisted state for Home/Character; never synthesizes or awards progress. */
export async function readProgression(txn: Transaction, now = new Date().toISOString()): Promise<ProgressionState> {
  return readForPlayer(txn, await playerId(txn), now);
}
async function award(txn: Transaction, player: PlayerProfile, key: string, kind: 'MILESTONE' | 'WEEKLY',
  xp: number, energy: number, now: string): Promise<PlayerProfile> {
  const claim = await txn.runAsync(
    'INSERT INTO progression_claims(player_id,claim_key,kind,reward_xp,reward_energy,created_at) VALUES(?,?,?,?,?,?) ON CONFLICT(player_id,claim_key) DO NOTHING',
    player.id, key, kind, xp, energy, now);
  if (!claim.changes) return player;
  const next = applyQuestRewards(player, { realXp: xp, gameEnergy: energy }, now);
  const id = `progression:${player.id}:${key}`;
  const event: VerifiedEvent = {
    id, playerId: player.id, questId: id, createdAt: now, verificationType: 'MULTI',
    verificationScore: 100, verified: true, realXpAwarded: xp, skillXpAwarded: {}, gameEnergyAwarded: energy,
    levelBefore: player.realLevel, levelAfter: next.realLevel,
  };
  await txn.runAsync('INSERT INTO verified_events(id,quest_id,payload,created_at) VALUES(?,?,?,?)', id, id, JSON.stringify(event), now);
  return next;
}
/**
 * Invoke after awardProtocols, within the existing verified-completion transaction.
 * Caller persists the returned player, the canonical completion and its verified event together.
 * Never opens a database, starts a second transaction, or trusts UI progress/reward values.
 */
export async function applyProgression(txn: Transaction, player: PlayerProfile,
  quest: Pick<Quest, 'id' | 'category'>, evidence: QuestEvidence, eventKey: string, now: string): Promise<PlayerProfile> {
  const today = checkedDay(now);
  if (!eventKey.trim() || evidence.questId !== quest.id || await playerId(txn) !== player.id) throw new Error('Progression identity mismatch.');
  const previous = await txn.getFirstAsync<{ quest_id: string }>(
    'SELECT quest_id FROM progression_contributions WHERE player_id=? AND event_key=?', player.id, eventKey);
  if (previous) {
    if (previous.quest_id !== quest.id) throw new Error('Progression event identity mismatch.');
    return player;
  }
  const distance = evidence.verificationType === 'TIMER' ? 0 : evidence.distanceMeters;
  if (!Number.isFinite(distance) || distance < 0) throw new Error('Invalid verified progression distance.');
  const before = await readForPlayer(txn, player.id, now);
  if (before.clockAnomaly) throw new Error('Progression clock anomaly. Check the device date.');
  const contribution = await txn.runAsync(
    'INSERT INTO progression_contributions(player_id,event_key,quest_id,day_key,week_key,daily,distance,created_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT DO NOTHING',
    player.id, eventKey, quest.id, today, weekKey(today), quest.category === 'DAILY' ? 1 : 0, distance, now);
  if (!contribution.changes) return player;
  const state = await readForPlayer(txn, player.id, now);
  let next = player;
  for (const milestone of STREAK_MILESTONES) {
    if (state.streak.currentStreak < milestone) continue;
    const reward = getMilestoneReward(milestone);
    next = await award(txn, next, 'milestone:' + milestone, 'MILESTONE', reward.realXp, reward.energy, now);
  }
  for (const challenge of state.weeklyChallenges) {
    if (challenge.progress < challenge.target) continue;
    next = await award(txn, next, `weekly:${state.weekKey}:${challenge.id}`, 'WEEKLY', challenge.rewardXp, challenge.rewardEnergy, now);
  }
  return next;
}
