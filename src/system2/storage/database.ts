import * as SQLite from 'expo-sqlite';

import {
    createNewPlayer,
    PlayerProfile,
    VerifiedEvent,
} from '../core';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync('system2.db');
  }

  return databasePromise;
}

export async function initSystemDatabase() {
  const db = await getDatabase();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quest_completions (
      quest_id TEXT PRIMARY KEY NOT NULL,
      completed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS verified_events (
      id TEXT PRIMARY KEY NOT NULL,
      quest_id TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

export async function loadOrCreatePlayer(): Promise<PlayerProfile> {
  await initSystemDatabase();

  const db = await getDatabase();

  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM app_state WHERE key = ?`,
    'player'
  );

  if (row?.value) {
    try {
      return JSON.parse(row.value) as PlayerProfile;
    } catch {
      // Jeżeli zapis jest uszkodzony, tworzymy czysty profil.
    }
  }

  const player = createNewPlayer('GRACZ');

  await savePlayer(player);

  return player;
}

export async function savePlayer(player: PlayerProfile) {
  await initSystemDatabase();

  const db = await getDatabase();

  await db.runAsync(
    `
      INSERT INTO app_state (key, value)
      VALUES (?, ?)
      ON CONFLICT(key)
      DO UPDATE SET value = excluded.value
    `,
    'player',
    JSON.stringify(player)
  );
}

export async function isQuestCompleted(
  questId: string
): Promise<boolean> {
  await initSystemDatabase();

  const db = await getDatabase();

  const row = await db.getFirstAsync<{ quest_id: string }>(
    `
      SELECT quest_id
      FROM quest_completions
      WHERE quest_id = ?
    `,
    questId
  );

  return Boolean(row);
}

export async function recordVerifiedEvent(
  event: VerifiedEvent
) {
  await initSystemDatabase();

  const db = await getDatabase();

  await db.runAsync(
    `
      INSERT OR IGNORE INTO verified_events
      (id, quest_id, payload, created_at)
      VALUES (?, ?, ?, ?)
    `,
    event.id,
    event.questId,
    JSON.stringify(event),
    event.createdAt
  );

  await db.runAsync(
    `
      INSERT OR IGNORE INTO quest_completions
      (quest_id, completed_at)
      VALUES (?, ?)
    `,
    event.questId,
    event.createdAt
  );
}