import type { SQLiteDatabase } from 'expo-sqlite';
import { addRealXp, type PlayerProfile, type VerifiedEvent } from '../core';
import { dayKey, dayOrdinal, weekKey, nextStreak, DAILY_RULES } from '../daily/calendar';
import { generateDailyHF, refillDailySlot, getEligibleTemplates, DAILY_HF_CONFIG, dailyQuest } from '../daily/templatesHF';
import { DEFAULT_ACTIVITIES, type ActivityPreferences } from '../daily/templates';
export type DailyState = { 
  dayKey: string; 
  weekKey: string; 
  questIds: string[]; 
  suspiciousQuestIds: string[]; 
  completed: number; 
  weeklyCompleted: number; 
  clear: boolean; 
  weeklyClear: boolean; 
  clockAnomaly: boolean;
  // High-frequency fields
  activeSlots: number;
  remainingCompletions: number;
  xpEarnedToday: number;
  xpBudget: number;
  completedCount: number;
  milestonesAchieved: number[];
  refillCount: number;
};
async function state(db: SQLiteDatabase, key: string) { return (await db.getFirstAsync<{ value: string }>('SELECT value FROM app_state WHERE key = ?', key))?.value; }
async function setState(db: SQLiteDatabase, key: string, value: string) { await db.runAsync('INSERT INTO app_state(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', key, value); }

async function loadDailyHFProgress(db: SQLiteDatabase, day: string): Promise<{ xpEarned: number; completions: number; remaining: number; activeSlots: number; refillCount: number; milestones: number[] }> {
  const row = await db.getFirstAsync<{ xp_earned: number; completions: number; remaining: number; active_slots: number; refill_count: number }>(
    'SELECT xp_earned, completions, remaining, active_slots, refill_count FROM daily_hf_progress WHERE day_key = ?', day
  );
  const milestones = await db.getAllAsync<{ milestone: number }>('SELECT milestone FROM daily_hf_milestones WHERE day_key = ?', day);
  return {
    xpEarned: row?.xp_earned ?? 0,
    completions: row?.completions ?? 0,
    remaining: row?.remaining ?? DAILY_HF_CONFIG.MAX_COMPLETIONS_PER_DAY,
    activeSlots: row?.active_slots ?? DAILY_HF_CONFIG.ACTIVE_SLOTS,
    refillCount: row?.refill_count ?? 0,
    milestones: milestones.map(m => m.milestone),
  };
}

async function saveDailyHFProgress(db: SQLiteDatabase, day: string, progress: {
  xpEarned: number;
  completions: number;
  remaining: number;
  activeSlots: number;
  refillCount: number;
}) {
  await db.runAsync(
    `INSERT INTO daily_hf_progress (day_key, xp_earned, completions, remaining, active_slots, refill_count, last_completed_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(day_key) DO UPDATE SET
       xp_earned = excluded.xp_earned,
       completions = excluded.completions,
       remaining = excluded.remaining,
       active_slots = excluded.active_slots,
       refill_count = excluded.refill_count,
       last_completed_at = excluded.last_completed_at`,
    day, progress.xpEarned, progress.completions, progress.remaining, progress.activeSlots, progress.refillCount, new Date().toISOString(), new Date().toISOString()
  );
}

export async function dailyState(db: SQLiteDatabase, player: PlayerProfile, unlocked: boolean, prefs: ActivityPreferences = DEFAULT_ACTIVITIES, now = Date.now()): Promise<DailyState | null> {
  const today = dayKey(now), highClock = Number(await state(db, 'last_known_wall_clock') ?? 0), highDay = await state(db, 'last_daily_day');
  const anomaly = now < highClock - DAILY_RULES.clockToleranceMs || Boolean(highDay && today < highDay);
  const day = anomaly && highDay ? highDay : today, week = weekKey(day);
  const capabilities = {
    hasGPS: true,
    hasMotion: true,
    worldUnlocked: true,
  };
  
  const hfProgress = await loadDailyHFProgress(db, day);
  const completedCount = hfProgress.completions;
  let remaining = DAILY_HF_CONFIG.MAX_COMPLETIONS_PER_DAY - completedCount;
  
  if (!anomaly) {
    await setState(db, 'last_known_wall_clock', String(Math.max(now, highClock)));
    await setState(db, 'last_daily_day', day);
    const exists = await db.getFirstAsync('SELECT day_key FROM daily_sets WHERE day_key = ?', day);
    if (!exists) {
      await db.runAsync('INSERT INTO daily_sets(day_key, created_at) VALUES (?, ?)', day, new Date(now).toISOString());
      const initialQuests = generateDailyHF(player.id, day, prefs, capabilities, completedCount);
      for (const quest of initialQuests) await db.runAsync('INSERT INTO daily_instances(id, template_id, day_key, week_key) VALUES (?, ?, ?, ?)', quest.id, quest.templateId!, day, week);
      await saveDailyHFProgress(db, day, { xpEarned: 0, completions: 0, remaining: DAILY_HF_CONFIG.MAX_COMPLETIONS_PER_DAY, activeSlots: DAILY_HF_CONFIG.ACTIVE_SLOTS, refillCount: 0 });
    }
  }
  
  const rows = await db.getAllAsync<{ id: string }>('SELECT id FROM daily_instances WHERE day_key = ? ORDER BY rowid', day);
  const activeIds = rows.map(r => r.id);
  
  // Refill empty slots if needed
  if (activeIds.length < DAILY_HF_CONFIG.ACTIVE_SLOTS && remaining > 0) {
    const hfProgress = await loadDailyHFProgress(db, day);
    const refillCount = hfProgress.refillCount;
    for (let i = activeIds.length; i < DAILY_HF_CONFIG.ACTIVE_SLOTS && remaining > 0; i++) {
      const refill = refillDailySlot(player.id, day, DEFAULT_ACTIVITIES, { hasGPS: true, hasMotion: true, worldUnlocked: true }, hfProgress.completions, activeIds);
      if (refill) {
        await db.runAsync('INSERT INTO daily_instances(id, template_id, day_key, week_key) VALUES (?, ?, ?, ?)', refill.id, refill.templateId!, day, week);
        await db.runAsync('INSERT INTO daily_instances_refill(id, original_id, refill_count, refilled_at) VALUES (?, ?, ?, ?)', 
          `refill_${Date.now()}_${i}`, refill.id, refillCount + 1, new Date().toISOString());
        activeIds.push(refill.id);
        remaining--;
      }
    }
    await saveDailyHFProgress(db, day, { 
      xpEarned: hfProgress.xpEarned, 
      completions: hfProgress.completions, 
      remaining: remaining, 
      activeSlots: activeIds.length, 
      refillCount: refillCount + (activeIds.length - rows.length)
    });
  }

  const count = async (column: 'day_key' | 'week_key', key: string) => (await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM daily_instances d JOIN quest_completions q ON q.quest_id=d.id WHERE d.${column}=?`, key))?.n ?? 0;
  const attempts = await db.getAllAsync<{ quest_id: string; payload: string }>("SELECT e.quest_id, e.payload FROM verified_events e JOIN daily_instances d ON d.id=e.quest_id WHERE d.day_key=? AND e.id LIKE 'attempt_%'", day);
  
  return { 
    suspiciousQuestIds: attempts.filter(row => JSON.parse(row.payload).activity?.verdict === 'SUSPICIOUS').map(row => row.quest_id), 
    dayKey: day, 
    weekKey: week, 
    questIds: activeIds, 
    completed: hfProgress.completions, 
    weeklyCompleted: await count('week_key', week),
    clear: Boolean(await db.getFirstAsync('SELECT bonus_key FROM protocol_bonuses WHERE bonus_key = ?', 'daily_clear:' + day)),
    weeklyClear: Boolean(await db.getFirstAsync('SELECT bonus_key FROM protocol_bonuses WHERE bonus_key = ?', 'weekly_complete:' + week)), 
    clockAnomaly: anomaly,
    // High-frequency fields
    activeSlots: activeIds.length,
    remainingCompletions: remaining,
    xpEarnedToday: hfProgress.xpEarned,
    xpBudget: DAILY_HF_CONFIG.XP_BUDGET,
    completedCount: hfProgress.completions,
    milestonesAchieved: hfProgress.milestones,
    refillCount: hfProgress.refillCount,
  };
}

export async function ensureDailyAccess(db: SQLiteDatabase, player: PlayerProfile, id: string, unlocked: boolean, prefs: ActivityPreferences) {
  const daily = await dailyState(db, player, unlocked, prefs);
  if (!daily || daily.clockAnomaly || !daily.questIds.includes(id)) throw new Error('Ten Daily nie jest dostępny. Odśwież listę misji i sprawdź datę telefonu.');
  return daily;
}

export async function awardDailyHFCompletion(db: SQLiteDatabase, player: PlayerProfile, questId: string, xpEarned: number, skillXpEarned: Record<string, number>, energyEarned: number, now: string) {
  const quest = dailyQuest(questId); if (!quest) return player;
  const day = quest.dayKey!, week = weekKey(day);
  
  const hfProgress = await loadDailyHFProgress(db, day);
  const newCompletions = hfProgress.completions + 1;
  const newXpEarned = hfProgress.xpEarned + xpEarned;
  const newRemaining = Math.max(0, DAILY_HF_CONFIG.MAX_COMPLETIONS_PER_DAY - newCompletions);
  
  // Check for milestone achievements
  const milestones = DAILY_HF_CONFIG.MILESTONES;
  const newMilestones: number[] = [];
  for (const m of milestones) {
    if (newCompletions >= m && !hfProgress.milestones.includes(m)) {
      newMilestones.push(m);
      await db.runAsync('INSERT INTO daily_hf_milestones(day_key, milestone, achieved_at) VALUES (?, ?, ?)', day, m, new Date().toISOString());
    }
  }
  
  await db.runAsync(
    `UPDATE daily_hf_progress SET 
       xp_earned = ?, completions = ?, remaining = ?, last_completed_at = ?
     WHERE day_key = ?`,
    newXpEarned, newCompletions, newRemaining, new Date().toISOString(), day
  );
  
  if (newMilestones.length > 0) {
    // Milestone bonus XP
    for (const m of newMilestones) {
      const bonusXp = m * 10;
      player = addRealXp(player, bonusXp);
      await db.runAsync('INSERT INTO verified_events(id, quest_id, payload, created_at) VALUES (?, ?, ?, ?)', 
        `milestone:${m}:${day}`, `milestone_${m}`, JSON.stringify({ milestone: m, bonusXp }), now);
    }
  }
  
  return player;
}

export async function awardProtocols(db: SQLiteDatabase, player: PlayerProfile, questId: string, now: string) {
  const quest = dailyQuest(questId); if (!quest) return player;
  let next = player;
  const day = quest.dayKey!, week = weekKey(day);
  const count = async (column: 'day_key' | 'week_key', key: string) => (await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM daily_instances d JOIN quest_completions q ON q.quest_id=d.id WHERE d.${column}=?`, key))?.n ?? 0;
  for (const [kind, key, eligible, xp, energy] of [
    ['daily_clear', day, await count('day_key', day) === DAILY_RULES.slots, DAILY_RULES.clearXp, DAILY_RULES.clearEnergy],
    ['weekly_complete', week, await count('week_key', week) >= DAILY_RULES.weeklyTarget, DAILY_RULES.weeklyXp, DAILY_RULES.weeklyEnergy],
  ] as const) {
    if (!eligible) continue;
    const id = kind + ':' + key;
    const claim = await db.runAsync('INSERT INTO protocol_bonuses(bonus_key, kind, period_key, created_at, streak) VALUES (?, ?, ?, ?, 0) ON CONFLICT(bonus_key) DO NOTHING', id, kind, key, now);
    if (!claim.changes) continue;
    next = { ...addRealXp(next, xp), gameEnergy: next.gameEnergy + energy };
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