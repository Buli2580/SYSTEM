// SYSTEM 2.0 - Achievement Storage
// Persistence layer for achievement state

import * as SQLite from 'expo-sqlite';
import type { AchievementProgress, PlayerTitleState } from '../achievements/types';

const ACHIEVEMENTS_TABLE = 'achievements';
const TITLES_TABLE = 'player_titles';
const ACHIEVEMENT_EVENTS_TABLE = 'achievement_events';

export async function initAchievementsDatabase(): Promise<void> {
  const db = await getDatabase();
  await db.withExclusiveTransactionAsync(async txn => {
    await txn.execAsync(`
      CREATE TABLE IF NOT EXISTS ${ACHIEVEMENTS_TABLE} (
        id TEXT PRIMARY KEY NOT NULL,
        state TEXT NOT NULL CHECK(state IN ('LOCKED', 'IN_PROGRESS', 'UNLOCKED', 'CLAIMED')),
        current_progress INTEGER NOT NULL DEFAULT 0,
        max_progress INTEGER NOT NULL DEFAULT 0,
        unlocked_at TEXT,
        claimed_at TEXT,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_achievements_state ON achievements(state);
      
      CREATE TABLE IF NOT EXISTS ${TITLES_TABLE} (
        id TEXT PRIMARY KEY NOT NULL,
        unlocked INTEGER NOT NULL DEFAULT 0,
        unlocked_at TEXT,
        is_active INTEGER NOT NULL DEFAULT 0
      );
      
      CREATE TABLE IF NOT EXISTS ${ACHIEVEMENT_EVENTS_TABLE} (
        id TEXT PRIMARY KEY NOT NULL,
        type TEXT NOT NULL,
        achievement_id TEXT,
        title_id TEXT,
        payload TEXT,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_achievement_events_type ON achievement_events(type);
      CREATE INDEX IF NOT EXISTS idx_achievement_events_achievement ON achievement_events(achievement_id);
    `);
  });
}

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync('system2.db').catch(error => {
      databasePromise = null;
      throw error;
    });
  }
  return databasePromise;
}

let initializationPromise: Promise<void> | null = null;

function ensureAchievementsDatabase(): Promise<void> {
  if (!initializationPromise) {
    initializationPromise = initAchievementsDatabase().catch(error => {
      initializationPromise = null;
      throw error;
    });
  }
  return initializationPromise;
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

export async function loadAchievementsState(): Promise<Record<string, { state: 'LOCKED' | 'IN_PROGRESS' | 'UNLOCKED' | 'CLAIMED'; currentProgress: number; maxProgress: number; unlockedAt?: string; claimedAt?: string }>> {
  await ensureAchievementsDatabase();
  const db = await getDatabase();
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

export async function saveAchievementProgress(achievementId: string, progress: {
  state: 'LOCKED' | 'IN_PROGRESS' | 'UNLOCKED' | 'CLAIMED';
  currentProgress: number;
  maxProgress: number;
  unlockedAt?: string;
  claimedAt?: string;
}): Promise<void> {
  await ensureAchievementsDatabase();
  const db = await getDatabase();
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

export async function unlockAchievement(achievementId: string): Promise<void> {
  const now = new Date().toISOString();
  await saveAchievementProgress(achievementId, {
    state: 'UNLOCKED',
    currentProgress: 1,
    maxProgress: 1,
    unlockedAt: now,
    claimedAt: undefined,
  });
}

export async function claimAchievement(achievementId: string): Promise<void> {
  const now = new Date().toISOString();
  await saveAchievementProgress(achievementId, {
    state: 'CLAIMED',
    currentProgress: 1,
    maxProgress: 1,
    unlockedAt: undefined,
    claimedAt: now,
  });
}

export async function updateAchievementProgress(achievementId: string, currentProgress: number, maxProgress: number): Promise<void> {
  await saveAchievementProgress(achievementId, {
    state: 'IN_PROGRESS',
    currentProgress,
    maxProgress,
    unlockedAt: undefined,
    claimedAt: undefined,
  });
}

export async function loadTitlesState(): Promise<PlayerTitleState> {
  await ensureAchievementsDatabase();
  const db = await getDatabase();
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

export async function saveTitleState(titleId: string, state: { unlocked: boolean; isActive?: boolean }): Promise<void> {
  await ensureAchievementsDatabase();
  const db = await getDatabase();
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

export async function unlockTitle(titleId: string): Promise<void> {
  await saveTitleState(titleId, { unlocked: true });
}

export async function setActiveTitle(titleId: string): Promise<void> {
  await ensureAchievementsDatabase();
  const db = await getDatabase();
  await db.withExclusiveTransactionAsync(async txn => {
    await txn.runAsync('UPDATE player_titles SET is_active = 0');
    await txn.runAsync(
      'UPDATE player_titles SET is_active = 1, unlocked = 1, unlocked_at = ? WHERE id = ?',
      new Date().toISOString(), titleId
    );
  });
}

export async function getActiveTitle(): Promise<string | null> {
  await ensureAchievementsDatabase();
  const db = await getDatabase();
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

export async function recordAchievementEvent(
  type: string,
  achievementId: string | null,
  titleId: string | null,
  payload: Record<string, unknown>
): Promise<void> {
  await ensureAchievementsDatabase();
  const db = await getDatabase();
  const id = `event_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  await db.runAsync(
    `INSERT INTO achievement_events (id, type, achievement_id, title_id, payload, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    id, type, achievementId, titleId, JSON.stringify(payload), Date.now()
  );
}

export async function getRecentAchievementEvents(limit: number = 50): Promise<AchievementEventRecord[]> {
  await ensureAchievementsDatabase();
  const db = await getDatabase();
  const rows = await db.getAllAsync<AchievementEventRow>(
    `SELECT * FROM achievement_events ORDER BY created_at DESC LIMIT ?`,
    limit
  );
  return rows.map(r => ({
    ...r,
    payload: JSON.parse(r.payload),
  }));
}