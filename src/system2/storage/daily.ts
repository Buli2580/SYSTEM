import { attemptWasSuspicious } from '../daily/attempt';
import { loadAdaptivePlan } from '../adaptive/storage';
import { applyQuestRewards } from '../core/questEngine';
import type { SQLiteDatabase } from 'expo-sqlite';
import { type PlayerProfile, type VerifiedEvent } from '../core';
import { dayKey, dayOrdinal, weekKey, nextStreak, DAILY_RULES } from '../daily/calendar';
import { dailyQuest, DEFAULT_ACTIVITIES, type ActivityPreferences } from '../daily/templates';
import { createGeneratedDaily } from './generation';
import { applyMissedDailyConsequence } from './aiState';
export type DailyState = { rerollsUsed?: number; attemptedQuestIds?: string[]; reasons?: Record<string,string>; dayKey: string; weekKey: string; questIds: string[]; suspiciousQuestIds: string[]; completed: number; weeklyCompleted: number; weeklyTarget: number; clear: boolean; weeklyClear: boolean; clockAnomaly: boolean };
async function state(db: SQLiteDatabase, key: string) { return (await db.getFirstAsync<{ value: string }>('SELECT value FROM app_state WHERE key = ?', key))?.value; }
async function setState(db: SQLiteDatabase, key: string, value: string) { await db.runAsync('INSERT INTO app_state(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', key, value); }
export async function dailyState(db: SQLiteDatabase, player: PlayerProfile, unlocked: boolean, prefs: ActivityPreferences = DEFAULT_ACTIVITIES, now = Date.now()): Promise<DailyState | null> {
 if (!unlocked) return null;
 const today = dayKey(now), highClock = Number(await state(db, 'last_known_wall_clock') ?? 0), highDay = await state(db, 'last_daily_day');
 const anomaly = now < highClock - DAILY_RULES.clockToleranceMs || Boolean(highDay && today < highDay);
 const day = anomaly && highDay ? highDay : today, week = weekKey(day);
 const weeklyKey='adaptive_weekly_target:'+week;
 let weeklyTarget=Number(await state(db,weeklyKey))||DAILY_RULES.weeklyTarget;
 if (!anomaly) {
   if(!await state(db,weeklyKey)){
     const existing=await db.getFirstAsync('SELECT id FROM daily_instances WHERE week_key=? LIMIT 1',week);
     weeklyTarget=existing?DAILY_RULES.weeklyTarget:(await loadAdaptivePlan(db,new Date(now).toISOString())).weeklyCount===1?3:5;
     await setState(db,weeklyKey,String(weeklyTarget));
   }
   await setState(db, 'last_known_wall_clock', String(Math.max(now, highClock)));
   await setState(db, 'last_daily_day', day);
   const exists = await db.getFirstAsync('SELECT day_key FROM daily_sets WHERE day_key = ?', day);
   if (!exists) {
     await applyMissedDailyConsequence(db, day);
     await db.runAsync('INSERT INTO daily_sets(day_key, created_at) VALUES (?, ?)', day, new Date(now).toISOString());
      await createGeneratedDaily(db, {...player, streak: await currentStreak(db, day, player.streak)}, day, prefs);
   }
 }
 const rows = await db.getAllAsync<{ id: string }>('SELECT id FROM daily_instances WHERE day_key = ? ORDER BY rowid', day);
 const count = async (column: 'day_key' | 'week_key', key: string) => (await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM daily_instances d JOIN quest_completions q ON q.quest_id=d.id WHERE d.${column}=?`, key))?.n ?? 0;
 const attempts = await db.getAllAsync<{ quest_id: string; payload: string }>("SELECT e.quest_id, e.payload FROM verified_events e JOIN daily_instances d ON d.id=e.quest_id WHERE d.day_key=? AND e.id LIKE 'attempt_%'", day);
  const attempted = await db.getAllAsync<{quest_id:string}>('SELECT DISTINCT a.quest_id FROM quest_attempts a JOIN daily_instances d ON d.id=a.quest_id WHERE d.day_key=?',day);
  const rerollsUsed = (await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM daily_rerolls WHERE day_key=?', day
  ))?.n ?? 0;
  const generated = await db.getAllAsync<{ quest_id: string; reason: string }>(
    'SELECT quest_id,reason FROM daily_generation WHERE day_key=?', day
  );
  const reasons = Object.fromEntries(
    generated.map(row => [row.quest_id, row.reason])
  );
  return { attemptedQuestIds: attempted.map(r=>r.quest_id), weeklyTarget, rerollsUsed, reasons, suspiciousQuestIds: attempts.filter(row => attemptWasSuspicious(row.payload)).map(row => row.quest_id), dayKey: day, weekKey: week, questIds: rows.map(r => r.id), completed: await count('day_key', day), weeklyCompleted: await count('week_key', week),
 clear: Boolean(await db.getFirstAsync('SELECT bonus_key FROM protocol_bonuses WHERE bonus_key = ?', 'daily_clear:' + day)),
 weeklyClear: Boolean(await db.getFirstAsync('SELECT bonus_key FROM protocol_bonuses WHERE bonus_key = ?', 'weekly_complete:' + week)), clockAnomaly: anomaly };
}
export async function ensureDailyAccess(db: SQLiteDatabase, player: PlayerProfile, id: string, unlocked: boolean, prefs: ActivityPreferences) {
 const daily = await dailyState(db, player, unlocked, prefs);
 if (!daily || daily.clockAnomaly || !daily.questIds.includes(id)) throw new Error('Ten Daily nie jest dostępny. Odśwież listę misji i sprawdź datę telefonu.');
 return daily;
}
export async function awardProtocols(db: SQLiteDatabase, player: PlayerProfile, questId: string, now: string) {
 const instance = await db.getFirstAsync<{ day_key: string }>(
   'SELECT day_key FROM daily_instances WHERE id = ?', questId
 );
 if (!instance) return player;
 let next = player;
 const day = instance.day_key, week = weekKey(day);
 const count = async (column: 'day_key' | 'week_key', key: string) => (await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM daily_instances d JOIN quest_completions q ON q.quest_id=d.id WHERE d.${column}=?`, key))?.n ?? 0;
 const assigned=(await db.getFirstAsync<{n:number}>('SELECT COUNT(*) AS n FROM daily_instances WHERE day_key=?',day))?.n??0;
 for (const [kind, key, eligible, xp, energy] of [
   ['daily_clear', day, assigned>0 && await count('day_key', day) === assigned, DAILY_RULES.clearXp, DAILY_RULES.clearEnergy],
   ['weekly_complete', week, await count('week_key', week) >= (Number(await state(db,'adaptive_weekly_target:'+week))||DAILY_RULES.weeklyTarget), DAILY_RULES.weeklyXp, DAILY_RULES.weeklyEnergy],
 ] as const) {
   if (!eligible) continue;
   const id = kind + ':' + key;
   const claim = await db.runAsync('INSERT INTO protocol_bonuses(bonus_key, kind, period_key, created_at, streak) VALUES (?, ?, ?, ?, 0) ON CONFLICT(bonus_key) DO NOTHING', id, kind, key, now);
   if (!claim.changes) continue;
   next = applyQuestRewards(next, { realXp: xp, gameEnergy: energy }, now);
   if (kind === 'daily_clear') {
     const previous = await db.getFirstAsync<{ period_key: string; streak: number }>("SELECT period_key, streak FROM protocol_bonuses WHERE kind='daily_clear' AND period_key < ? ORDER BY period_key DESC LIMIT 1", day);
     next.streak = nextStreak(previous?.period_key, day, previous?.streak ?? 0);
     await db.runAsync('UPDATE protocol_bonuses SET streak = ? WHERE bonus_key = ?', next.streak, id);
   }
   const event: VerifiedEvent = { id, playerId: player.id, questId: id, createdAt: now, verificationType: 'MULTI', verificationScore: 100, verified: true, realXpAwarded: xp, gameEnergyAwarded: energy, skillXpAwarded: {} };
   await db.runAsync('INSERT INTO verified_events(id, quest_id, payload, created_at) VALUES (?, ?, ?, ?)', id, id, JSON.stringify(event), now);
 }
 return next;
}
export async function currentStreak(db: SQLiteDatabase, day: string, fallback: number) {
 const row = await db.getFirstAsync<{ period_key: string; streak: number }>("SELECT period_key, streak FROM protocol_bonuses WHERE kind='daily_clear' ORDER BY period_key DESC LIMIT 1");
 return row ? dayOrdinal(day) - dayOrdinal(row.period_key) > 1 ? 0 : row.streak : fallback;
}
