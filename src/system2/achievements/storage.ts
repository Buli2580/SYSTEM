import type { SQLiteDatabase } from 'expo-sqlite';
import { profileTransaction } from '../storage/database';
import { ensureAchievementSchema } from './schema';
import type { PlayerTitleState } from './types';

export function achievementTransaction<T>(task: (txn: SQLiteDatabase) => Promise<T>): Promise<T> {
  return profileTransaction(async txn => {
    await ensureAchievementSchema(txn);
    return task(txn);
  });
}

export function initAchievementsDatabase(): Promise<void> {
  return achievementTransaction(async () => {});
}

export type AchievementRow = {
  id: string;
  state: 'LOCKED' | 'IN_PROGRESS' | 'UNLOCKED' | 'CLAIMED';
  current_progress: number;
  max_progress: number;
  unlocked_at: string | null;
  claimed_at: string | null;
  updated_at: number;
};

async function loadAchievementsStateInTransaction(db: SQLiteDatabase): Promise<Record<string, { state: 'LOCKED' | 'IN_PROGRESS' | 'UNLOCKED' | 'CLAIMED'; currentProgress: number; maxProgress: number; unlockedAt?: string; claimedAt?: string }>> {
  const rows = await db.getAllAsync<{
    id: string;
    state: string;
    current_progress: number;
    max_progress: number;
    unlocked_at: string | null;
    claimed_at: string | null;
  }>(`SELECT * FROM achievements`);

  const state: Record<string, { state: 'LOCKED' | 'IN_PROGRESS' | 'UNLOCKED' | 'CLAIMED'; currentProgress: number; maxProgress: number; unlockedAt?: string; claimedAt?: string }> = {};

  for (const row of rows) {
    state[row.id] = {
      state: row.state as 'LOCKED' | 'IN_PROGRESS' | 'UNLOCKED' | 'CLAIMED',
      currentProgress: row.current_progress,
      maxProgress: row.max_progress,
      unlockedAt: row.unlocked_at ?? undefined,
      claimedAt: row.claimed_at ?? undefined,
    };
  }

  return state;
}

async function saveAchievementProgressInTransaction(db: SQLiteDatabase, achievementId: string, progress: {
  state: 'LOCKED' | 'IN_PROGRESS' | 'UNLOCKED' | 'CLAIMED';
  currentProgress: number;
  maxProgress: number;
  unlockedAt?: string;
  claimedAt?: string;
}): Promise<void> {
  if (!Number.isFinite(progress.currentProgress) || !Number.isFinite(progress.maxProgress) || progress.currentProgress < 0 || progress.maxProgress < 0) {
    throw new Error('Invalid achievement progress.');
  }
  const existing = (await loadAchievementsStateInTransaction(db))[achievementId];
  if (existing?.state === 'CLAIMED') return;
  if (existing?.state === 'UNLOCKED') {
    progress = { ...existing, state: progress.state === 'CLAIMED' ? 'CLAIMED' : 'UNLOCKED', claimedAt: progress.claimedAt ?? existing.claimedAt };
  }
  const now = Date.now();

  await db.runAsync(
    `INSERT INTO achievements (id, state, current_progress, max_progress, unlocked_at, claimed_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       state = excluded.state,
       current_progress = excluded.current_progress,
       max_progress = excluded.max_progress,
       unlocked_at = excluded.unlocked_at,
       claimed_at = excluded.claimed_at,
       updated_at = excluded.updated_at`,
    achievementId,
    progress.state,
    progress.currentProgress,
    progress.maxProgress,
    progress.unlockedAt ?? null,
    progress.claimedAt ?? null,
    now
  );
}

async function unlockAchievementInTransaction(db: SQLiteDatabase, achievementId: string): Promise<void> {
  const now = new Date().toISOString();
  await saveAchievementProgressInTransaction(db, achievementId, {
    state: 'UNLOCKED',
    currentProgress: 1,
    maxProgress: 1,
    unlockedAt: now,
    claimedAt: undefined,
  });
}

async function claimAchievementInTransaction(db: SQLiteDatabase, achievementId: string): Promise<void> {
  const existing = (await loadAchievementsStateInTransaction(db))[achievementId];
  if (!existing || (existing.state !== 'UNLOCKED' && existing.state !== 'CLAIMED')) {
    throw new Error('Achievement must be unlocked before it can be claimed.');
  }
  await saveAchievementProgressInTransaction(db, achievementId, {
    ...existing,
    state: 'CLAIMED',
    claimedAt: existing.claimedAt ?? new Date().toISOString(),
  });
}

async function updateAchievementProgressInTransaction(db: SQLiteDatabase, achievementId: string, currentProgress: number, maxProgress: number): Promise<void> {
  const existing = (await loadAchievementsStateInTransaction(db))[achievementId];
  if (existing?.state === 'UNLOCKED' || existing?.state === 'CLAIMED') return;
  if (!Number.isFinite(currentProgress) || !Number.isFinite(maxProgress)) throw new Error('Invalid achievement progress.');
  const safeMax = Math.max(0, maxProgress);
  const safeCurrent = Math.max(0, Math.min(currentProgress, safeMax));
  await saveAchievementProgressInTransaction(db, achievementId, {
    state: safeMax > 0 && safeCurrent >= safeMax ? 'UNLOCKED' : safeCurrent > 0 ? 'IN_PROGRESS' : 'LOCKED',
    currentProgress: safeCurrent,
    maxProgress: safeMax,
    unlockedAt: safeMax > 0 && safeCurrent >= safeMax ? new Date().toISOString() : undefined,
    claimedAt: undefined,
  });
}

async function loadTitlesStateInTransaction(db: SQLiteDatabase): Promise<PlayerTitleState> {
  const rows = await db.getAllAsync<{
    id: string;
    unlocked: number;
    unlocked_at: string | null;
    is_active: number;
  }>(`SELECT * FROM player_titles`);

  const titles: Record<string, { unlocked: boolean; unlockedAt?: string; isActive: boolean }> = {};
  let activeTitleId: string | null = null;

  for (const row of rows) {
    titles[row.id] = {
      unlocked: row.unlocked === 1,
      unlockedAt: row.unlocked_at ?? undefined,
      isActive: row.is_active === 1,
    };
    if (row.is_active === 1) {
      activeTitleId = row.id;
    }
  }

  return { titles, activeTitleId };
}

async function saveTitleStateInTransaction(db: SQLiteDatabase, titleId: string, state: { unlocked: boolean; isActive?: boolean }): Promise<void> {
  await db.runAsync(
    `INSERT INTO player_titles (id, unlocked, unlocked_at, is_active)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       unlocked = excluded.unlocked,
       unlocked_at = excluded.unlocked_at,
       is_active = excluded.is_active`,
    titleId,
    state.unlocked ? 1 : 0,
    state.unlocked ? new Date().toISOString() : null,
    state.isActive ? 1 : 0
  );
}

async function unlockTitleInTransaction(db: SQLiteDatabase, titleId: string): Promise<void> {
  const existing = (await loadTitlesStateInTransaction(db)).titles[titleId];
  if (!existing?.unlocked) await saveTitleStateInTransaction(db, titleId, { unlocked: true });
}

async function setActiveTitleInTransaction(db: SQLiteDatabase, titleId: string): Promise<void> {
  const title = await db.getFirstAsync<{ unlocked: number }>('SELECT unlocked FROM player_titles WHERE id = ?', titleId);
  if (title?.unlocked !== 1) throw new Error('Title must be unlocked before activation.');
  await db.runAsync('UPDATE player_titles SET is_active = 0');
  await db.runAsync('UPDATE player_titles SET is_active = 1 WHERE id = ?', titleId);
}

async function getActiveTitleInTransaction(db: SQLiteDatabase): Promise<string | null> {
  const row = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM player_titles WHERE is_active = 1 LIMIT 1'
  );
  return row?.id ?? null;
}

export type AchievementEventRecord = {
  id: string;
  type: string;
  achievement_id: string | null;
  title_id: string | null;
  payload: Record<string, unknown>;
  created_at: number;
};

type AchievementEventRow = Omit<AchievementEventRecord, 'payload'> & { payload: string };

async function recordAchievementEventInTransaction(db: SQLiteDatabase,
  type: string,
  achievementId: string | null,
  titleId: string | null,
  payload: Record<string, unknown>
): Promise<void> {
  const id = `event_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  await db.runAsync(
    `INSERT INTO achievement_events (id, type, achievement_id, title_id, payload, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    id, type, achievementId, titleId, JSON.stringify(payload), Date.now()
  );
}

async function resetAchievementDataInTransaction(db: SQLiteDatabase): Promise<void> {
  await db.runAsync('DELETE FROM achievement_events');
  await db.runAsync('DELETE FROM player_titles');
  await db.runAsync('DELETE FROM achievements');
}

async function getRecentAchievementEventsInTransaction(db: SQLiteDatabase, limit: number = 50): Promise<AchievementEventRecord[]> {
  const rows = await db.getAllAsync<AchievementEventRow>(
    `SELECT * FROM achievement_events ORDER BY created_at DESC LIMIT ?`,
    limit
  );
  return rows.map(r => ({
    ...r,
    payload: JSON.parse(r.payload),
  }));
}
function queued<A extends unknown[], R>(task: (txn: SQLiteDatabase, ...args: A) => Promise<R>) {
  return (...args: A): Promise<R> => achievementTransaction(txn => task(txn, ...args));
}

export const loadAchievementsState = queued(loadAchievementsStateInTransaction);
export const saveAchievementProgress = queued(saveAchievementProgressInTransaction);
export const unlockAchievement = queued(unlockAchievementInTransaction);
export const claimAchievement = queued(claimAchievementInTransaction);
export const updateAchievementProgress = queued(updateAchievementProgressInTransaction);
export const loadTitlesState = queued(loadTitlesStateInTransaction);
export const saveTitleState = queued(saveTitleStateInTransaction);
export const unlockTitle = queued(unlockTitleInTransaction);
export const setActiveTitle = queued(setActiveTitleInTransaction);
export const getActiveTitle = queued(getActiveTitleInTransaction);
export const recordAchievementEvent = queued(recordAchievementEventInTransaction);
export const resetAchievementData = queued(resetAchievementDataInTransaction);
export const getRecentAchievementEvents = queued(getRecentAchievementEventsInTransaction);

export const achievementStorage = {
  loadAchievementsState: loadAchievementsStateInTransaction,
  saveAchievementProgress: saveAchievementProgressInTransaction,
  loadTitlesState: loadTitlesStateInTransaction,
  unlockTitle: unlockTitleInTransaction,
  recordAchievementEvent: recordAchievementEventInTransaction,
};
