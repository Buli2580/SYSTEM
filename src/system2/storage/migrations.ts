import { PROGRESSION_SCHEMA_SQL } from './progression';
import type { SQLiteDatabase } from 'expo-sqlite';
export const SCHEMA_VERSION = 9;
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
   CREATE TABLE IF NOT EXISTS story_events(id TEXT PRIMARY KEY NOT NULL, type TEXT NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL, consumed INTEGER NOT NULL DEFAULT 0);`,
  `CREATE TABLE IF NOT EXISTS cloud_outbox(id TEXT PRIMARY KEY NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL, acknowledged_at TEXT);`,
  `CREATE TABLE IF NOT EXISTS achievements(id TEXT PRIMARY KEY NOT NULL, unlocked_at TEXT NOT NULL);`,
  `CREATE TABLE IF NOT EXISTS boss_progress(id TEXT PRIMARY KEY NOT NULL, started_at TEXT NOT NULL, start_day TEXT NOT NULL);`,
  `CREATE TABLE IF NOT EXISTS legacy_goal_imports(legacy_id TEXT PRIMARY KEY NOT NULL, canonical_id TEXT NOT NULL);`
];

const CANONICAL_GOALS_SQL = `CREATE TABLE IF NOT EXISTS player_goals(id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS legacy_goal_imports(legacy_id TEXT PRIMARY KEY NOT NULL, canonical_id TEXT NOT NULL);`;

// Inspect their actual shape, preserve legacy rows, and add every canonical family atomically.
async function reconcileBranchSchemas(txn: SQLiteDatabase) {
 const columns = await txn.getAllAsync<{name:string}>('PRAGMA table_info(player_goals)');
 if (columns.length && !columns.some(c => c.name === 'payload')) {
   if (await txn.getFirstAsync("SELECT name FROM sqlite_master WHERE type='table' AND name='legacy_player_goals_v8'"))
     throw new Error('Konflikt archiwum celów: zachowano dane, migracja wymaga sprawdzenia.');
   await txn.execAsync('ALTER TABLE player_goals RENAME TO legacy_player_goals_v8;');
 }
 await txn.execAsync(CANONICAL_GOALS_SQL);
 if (await txn.getFirstAsync("SELECT name FROM sqlite_master WHERE type='table' AND name='legacy_player_goals_v8'")) {
   const rows = await txn.getAllAsync<Record<string,unknown>>('SELECT * FROM legacy_player_goals_v8');
   for (const row of rows) {
     const legacyId = String(row.id);
     if(await txn.getFirstAsync('SELECT legacy_id FROM legacy_goal_imports WHERE legacy_id=?',legacyId)) continue;
     const result = await txn.runAsync("INSERT INTO player_goals(payload) VALUES('{}')");
     const canonicalId = Number(result.lastInsertRowId);
     const id = String(canonicalId);
     const categories = ['FITNESS','STRENGTH','DISCIPLINE','PRODUCTIVITY','LEARNING','SOCIAL','LIFESTYLE','GENERAL'];
     const goal = {id,category:categories.includes(String(row.type))?String(row.type):'GENERAL',
       title:String(row.title??'Cel'),description:String(row.description??''),
       priority:row.priority==='CRITICAL'||row.priority==='HIGH'?3:row.priority==='LOW'?1:2,
       status:row.status==='COMPLETED'?'COMPLETED':row.status==='ACTIVE'?'ACTIVE':'PAUSED',
       createdAt:String(row.created_at??new Date(Date.now()).toISOString()),
       ...(row.target_date?{targetDate:String(row.target_date)}:{}),
       ...(row.progress_target!=null?{target:String(row.progress_target)+(row.unit?' '+String(row.unit):'')}:{}),
       legacySource:{table:'legacy_player_goals_v8',id:legacyId}};
     await txn.runAsync('UPDATE player_goals SET payload=? WHERE id=?',JSON.stringify(goal),canonicalId);
     await txn.runAsync('INSERT INTO legacy_goal_imports(legacy_id,canonical_id) VALUES(?,?)',legacyId,id);
   }
 }
 await txn.execAsync(PROGRESSION_SCHEMA_SQL);
}

export async function migrateDatabase(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL;');
  await db.withExclusiveTransactionAsync(async txn => {
    // The no-op write locks a concurrent migrator before reading user_version.
    await txn.execAsync('CREATE TABLE IF NOT EXISTS app_state (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);');
    await txn.runAsync('UPDATE app_state SET value = value WHERE key = ?', 'player');
    const row = await txn.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    const version = row?.user_version ?? 0;
    if (version > SCHEMA_VERSION) throw new Error('Ta baza wymaga nowszej wersji SYSTEMU.');
    for (let next = version + 1; next <= Math.min(SCHEMA_VERSION, steps.length); next++) {
      await txn.execAsync(steps[next - 1]);
      await txn.execAsync(`PRAGMA user_version = ${next};`);
    }
    // The cloud family may be absent even when legacy user_version is already 8.
    await txn.execAsync(steps[5]);
    await reconcileBranchSchemas(txn);
    await txn.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
  });
}
