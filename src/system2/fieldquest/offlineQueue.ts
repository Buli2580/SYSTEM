import * as SQLite from 'expo-sqlite';

const TABLE_OFFLINE_EVENTS = 'offline_events';

export type OfflineEventType =
  | 'QUEST_COMPLETED'
  | 'QUEST_STARTED'
  | 'QUEST_FAILED'
  | 'TELEMETRY'
  | 'REWARD_CLAIMED';

export type OfflineEvent = {
  id: string;
  type: OfflineEventType;
  payload: Record<string, any>;
  createdAt: number;
  retryCount: number;
  lastAttempt: number | null;
};

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync('system2.db').catch((error) => {
      databasePromise = null;
      throw error;
    });
  }
  return databasePromise;
}

export async function initOfflineQueue(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${TABLE_OFFLINE_EVENTS} (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      retry_count INTEGER NOT NULL DEFAULT 0,
      last_attempt INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_offline_events_pending ON ${TABLE_OFFLINE_EVENTS}(retry_count, created_at);
  `);
}

export async function enqueueOfflineEvent(
  type: OfflineEventType,
  payload: Record<string, any>
): Promise<void> {
  const db = await getDatabase();
  const id = `event_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  await db.runAsync(
    `INSERT INTO ${TABLE_OFFLINE_EVENTS} (id, type, payload, created_at, retry_count)
     VALUES (?, ?, ?, ?, 0)`,
    id, type, JSON.stringify(payload), Date.now()
  );
}

export async function getPendingOfflineEvents(limit: number = 50): Promise<OfflineEvent[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    type: string;
    payload: string;
    created_at: number;
    retry_count: number;
    last_attempt: number | null;
  }>(
    `SELECT * FROM ${TABLE_OFFLINE_EVENTS}
     WHERE retry_count < 5
     ORDER BY created_at ASC
     LIMIT ?`,
    limit
  );
  return rows.map(row => ({
    id: row.id,
    type: row.type as any,
    payload: JSON.parse(row.payload),
    createdAt: row.created_at,
    retryCount: row.retry_count,
    lastAttempt: row.last_attempt,
  }));
}

export async function markOfflineEventAttempted(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE ${TABLE_OFFLINE_EVENTS} SET retry_count = retry_count + 1, last_attempt = ? WHERE id = ?`,
    Date.now(), id
  );
}

export async function removeOfflineEvent(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM ${TABLE_OFFLINE_EVENTS} WHERE id = ?`, id);
}

export async function getPendingEventCount(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM ${TABLE_OFFLINE_EVENTS} WHERE retry_count < 5`
  );
  return row?.count ?? 0;
}