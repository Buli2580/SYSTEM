import type { SQLiteDatabase } from 'expo-sqlite';
export const SCHEMA_VERSION = 7;
const steps = [
  `CREATE TABLE IF NOT EXISTS app_state (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS quest_completions (quest_id TEXT PRIMARY KEY NOT NULL, completed_at TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS verified_events (id TEXT PRIMARY KEY NOT NULL, quest_id TEXT NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL);`,
  `CREATE TABLE IF NOT EXISTS chapter_completions (chapter_id TEXT PRIMARY KEY NOT NULL, completed_at TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS discovered_sectors (sector_id TEXT PRIMARY KEY NOT NULL, first_discovered_at TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS world_signals (id TEXT PRIMARY KEY NOT NULL, latitude REAL NOT NULL, longitude REAL NOT NULL,
     status TEXT NOT NULL CHECK(status IN ('DETECTED', 'LOCATED')), revision INTEGER NOT NULL, created_at TEXT NOT NULL, located_at TEXT);`,
  `CREATE INDEX IF NOT EXISTS verified_events_recent ON verified_events(created_at DESC, id);
   INSERT INTO app_state(key, value) SELECT 'onboarding_complete', 'true'
     WHERE EXISTS(SELECT 1 FROM app_state WHERE key = 'player') ON CONFLICT(key) DO NOTHING;`,
  `CREATE TABLE IF NOT EXISTS daily_sets(day_key TEXT PRIMARY KEY NOT NULL, created_at TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS daily_instances(id TEXT PRIMARY KEY NOT NULL, template_id TEXT NOT NULL, day_key TEXT NOT NULL, week_key TEXT NOT NULL, UNIQUE(day_key,template_id));
   CREATE INDEX IF NOT EXISTS daily_instances_week ON daily_instances(week_key);
   CREATE TABLE IF NOT EXISTS protocol_bonuses(bonus_key TEXT PRIMARY KEY NOT NULL, kind TEXT NOT NULL, period_key TEXT NOT NULL, created_at TEXT NOT NULL, streak INTEGER NOT NULL);`,
  `CREATE TABLE IF NOT EXISTS story_progress(id TEXT PRIMARY KEY NOT NULL, completed_at TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS quest_attempts(attempt_id TEXT PRIMARY KEY NOT NULL, quest_id TEXT NOT NULL, kind TEXT NOT NULL, started_at TEXT NOT NULL, ended_at TEXT, result TEXT, duration REAL NOT NULL DEFAULT 0, distance REAL NOT NULL DEFAULT 0, reason TEXT, eligible INTEGER NOT NULL DEFAULT 0);
   CREATE INDEX IF NOT EXISTS attempts_quest ON quest_attempts(quest_id,eligible,ended_at);
   CREATE INDEX IF NOT EXISTS attempts_kind ON quest_attempts(kind,eligible,ended_at);
   CREATE TABLE IF NOT EXISTS story_events(id TEXT PRIMARY KEY NOT NULL, type TEXT NOT NULL, title TEXT NOT NULL, subtitle TEXT, created_at TEXT NOT NULL, consumed INTEGER NOT NULL DEFAULT 0);
   CREATE INDEX IF NOT EXISTS story_events_pending ON story_events(consumed,created_at);
   CREATE TABLE IF NOT EXISTS boss_progress(id TEXT PRIMARY KEY NOT NULL, started_at TEXT NOT NULL, start_day TEXT NOT NULL, focus_at TEXT, move_at TEXT, discipline_at TEXT);`,
  `CREATE TABLE IF NOT EXISTS inventory_items(id TEXT PRIMARY KEY NOT NULL, payload TEXT NOT NULL, acquired_at TEXT NOT NULL);
   CREATE INDEX IF NOT EXISTS inventory_acquired ON inventory_items(acquired_at DESC,id);`,
  `CREATE TABLE IF NOT EXISTS reward_claims(reward_key TEXT PRIMARY KEY NOT NULL, payload TEXT NOT NULL, claimed_at TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS social_history(session_id TEXT PRIMARY KEY NOT NULL, mode TEXT NOT NULL, payload TEXT NOT NULL, completed_at TEXT NOT NULL);
   CREATE INDEX IF NOT EXISTS social_history_recent ON social_history(completed_at DESC,session_id);`,
];
export async function migrateDatabase(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL;');
  await db.withExclusiveTransactionAsync(async txn => {
    // The no-op write locks a concurrent migrator before reading user_version.
    await txn.execAsync('CREATE TABLE IF NOT EXISTS app_state (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);');
    await txn.runAsync('UPDATE app_state SET value = value WHERE key = ?', 'player');
    const row = await txn.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    const version = row?.user_version ?? 0;
    if (version > SCHEMA_VERSION) throw new Error('Ta baza wymaga nowszej wersji SYSTEMU.');
    for (let next = version + 1; next <= SCHEMA_VERSION; next++) {
      await txn.execAsync(steps[next - 1]);
      await txn.execAsync(`PRAGMA user_version = ${next};`);
    }
  });
}
