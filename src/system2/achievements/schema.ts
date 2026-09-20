import type { SQLiteDatabase } from 'expo-sqlite';

export async function ensureAchievementSchema(txn: SQLiteDatabase): Promise<void> {
  await txn.execAsync(`
      CREATE TABLE IF NOT EXISTS achievements (
        id TEXT PRIMARY KEY NOT NULL,
        state TEXT NOT NULL CHECK(state IN ('LOCKED', 'IN_PROGRESS', 'UNLOCKED', 'CLAIMED')),
        current_progress INTEGER NOT NULL DEFAULT 0,
        max_progress INTEGER NOT NULL DEFAULT 0,
        unlocked_at TEXT,
        claimed_at TEXT,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_achievements_state ON achievements(state);

      CREATE TABLE IF NOT EXISTS player_titles (
        id TEXT PRIMARY KEY NOT NULL,
        unlocked INTEGER NOT NULL DEFAULT 0,
        unlocked_at TEXT,
        is_active INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS achievement_events (
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
}
