import * as SQLite from 'expo-sqlite';

import {
  addRealXp, addSkillXp, createNewPlayer, SKILL_KEYS,
  type PlayerProfile, type SkillKey, type VerifiedEvent,
} from '../core';
import { validateQuestEvidence, getQuestStatus, prerequisitesCompleted } from '../quests/catalog';
import type { QuestEvidence } from '../quests/types';
import { awardAwakeningIfEligible } from './chapter';

export type CompleteQuestInput = QuestEvidence;
export type SystemSnapshot = {
  player: PlayerProfile;
  completedQuestIds: string[];
  awakeningCompleted: boolean;
  worldUnlocked: boolean;
  awakeningPending: boolean;
};
export type CompleteQuestResult = SystemSnapshot & { awarded: boolean; awakeningAwarded: boolean };

async function completedQuestIds(db: SQLite.SQLiteDatabase): Promise<string[]> {
  const rows = await db.getAllAsync<{ quest_id: string }>('SELECT quest_id FROM quest_completions');
  return rows.map(row => row.quest_id);
}

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;
let initializationPromise: Promise<void> | null = null;
let operations: Promise<unknown> = Promise.resolve();

// All SYSTEM writes share a queue. SQL uniqueness remains the final guard,
// including for another connection; a failed operation does not poison the queue.
function serialized<T>(task: () => Promise<T>): Promise<T> {
  const result = operations.then(task);
  operations = result.catch(() => undefined);
  return result;
}

function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync('system2.db').catch(error => {
      databasePromise = null;
      throw error;
    });
  }
  return databasePromise;
}

export async function initSystemDatabase() {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      const db = await getDatabase();
      await db.execAsync(`
        PRAGMA busy_timeout = 5000;
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS app_state (
          key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS quest_completions (
          quest_id TEXT PRIMARY KEY NOT NULL, completed_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS verified_events (
          id TEXT PRIMARY KEY NOT NULL, quest_id TEXT NOT NULL,
          payload TEXT NOT NULL, created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS chapter_completions (
          chapter_id TEXT PRIMARY KEY NOT NULL, completed_at TEXT NOT NULL
        );
      `);
    })().catch(error => {
      initializationPromise = null;
      throw error;
    });
  }
  await initializationPromise;
}

function parsePlayer(value: string): PlayerProfile {
  const player = JSON.parse(value) as PlayerProfile;
  const validNumber = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && n >= 0;
  if (!player || typeof player.id !== 'string' || !player.stats ||
      ![player.realLevel, player.realXp, player.realXpToNextLevel, player.totalRealXp,
        player.verifiedQuestCount, player.gameEnergy, player.totalDistanceMeters].every(validNumber) ||
      !SKILL_KEYS.every(key => {
        const skill = player.stats[key];
        return skill && [skill.level, skill.xp, skill.xpToNextLevel, skill.totalXp].every(validNumber);
      })) {
    throw new Error('Zapis profilu jest uszkodzony. Nie został nadpisany.');
  }
  return player;
}

async function readPlayer(db: SQLite.SQLiteDatabase): Promise<PlayerProfile> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_state WHERE key = ?', 'player'
  );
  if (!row) throw new Error('Nie znaleziono profilu SYSTEMU. Wróć na ekran główny.');
  return parsePlayer(row.value);
}

export function loadOrCreatePlayer(): Promise<PlayerProfile> {
  return loadSystemState().then(snapshot => snapshot.player);
}

export function isQuestCompleted(questId: string): Promise<boolean> {
  return serialized(async () => {
    await initSystemDatabase();
    const db = await getDatabase();
    return Boolean(await db.getFirstAsync(
      'SELECT quest_id FROM quest_completions WHERE quest_id = ?', questId
    ));
  });
}

export function getQuestAccess(questId: string) {
  return serialized(async () => {
    await initSystemDatabase();
    return getQuestStatus(questId, await completedQuestIds(await getDatabase()));
  });
}

async function snapshotInTransaction(db: SQLite.SQLiteDatabase) {
  const ids = await completedQuestIds(db);
  const chapter = await awardAwakeningIfEligible(db, await readPlayer(db), ids);
  const seen = await db.getFirstAsync('SELECT value FROM app_state WHERE key = ?', 'awakening_presentation_seen');
  return {
    ...chapter, completedQuestIds: ids, worldUnlocked: chapter.awakeningCompleted,
    awakeningPending: chapter.awakeningCompleted && !seen,
  };
}

export function completeVerifiedQuest(input: CompleteQuestInput): Promise<CompleteQuestResult> {
  // Snapshot caller data before entering the queue. Rewards come only from the quest definition.
  const evidence = { ...input };
  return serialized(async () => {
    const quest = validateQuestEvidence(evidence);
    await initSystemDatabase();
    const db = await getDatabase();
    let result: CompleteQuestResult | undefined;
    await db.withExclusiveTransactionAsync(async txn => {
      const now = new Date().toISOString();
      // First statement takes the write lock BEFORE reading the current profile.
      const claim = await txn.runAsync(
        'INSERT INTO quest_completions (quest_id, completed_at) VALUES (?, ?) ON CONFLICT(quest_id) DO NOTHING',
        quest.id, now
      );
      const player = await readPlayer(txn);
      if (claim.changes === 0) {
        result = { awarded: false, ...await snapshotInTransaction(txn) };
        return;
      }
      if (!prerequisitesCompleted(quest, await completedQuestIds(txn))) {
        throw new Error('Ta misja jest zablokowana. Ukończ poprzednie questy Awakening.');
      }
      let next = addRealXp(player, quest.rewards.realXp);
      for (const [key, xp] of Object.entries(quest.rewards.skillXp ?? {})) {
        next = addSkillXp(next, key as SkillKey, xp);
      }
      next = {
        ...next,
        verifiedQuestCount: next.verifiedQuestCount + 1,
        gameEnergy: next.gameEnergy + (quest.rewards.gameEnergy ?? 0),
        totalDistanceMeters: next.totalDistanceMeters + (evidence.verificationType !== 'TIMER' ? evidence.distanceMeters : 0),
        updatedAt: now,
      };
      const event: VerifiedEvent = {
        id: 'quest_' + quest.id,
        playerId: next.id, questId: quest.id, createdAt: now,
        verificationType: evidence.verificationType,
        verificationScore: evidence.verificationScore, verified: true,
        realXpAwarded: quest.rewards.realXp,
        skillXpAwarded: { ...quest.rewards.skillXp },
        gameEnergyAwarded: quest.rewards.gameEnergy ?? 0,
        distanceMeters: evidence.distanceMeters, durationSeconds: evidence.durationSeconds,
      };
      await txn.runAsync('UPDATE app_state SET value = ? WHERE key = ?', JSON.stringify(next), 'player');
      await txn.runAsync(
        'INSERT INTO verified_events (id, quest_id, payload, created_at) VALUES (?, ?, ?, ?)',
        event.id, quest.id, JSON.stringify(event), now
      );
      result = { awarded: true, ...await snapshotInTransaction(txn) };
    });
    if (!result) throw new Error('Nie udało się potwierdzić zapisu misji.');
    return result;
  });
}

export function loadSystemState(): Promise<SystemSnapshot> {
  return serialized(async () => {
    await initSystemDatabase();
    const db = await getDatabase();
    let snapshot: SystemSnapshot | undefined;
    await db.withExclusiveTransactionAsync(async txn => {
      // Additive initialization only. Existing profiles/completions are never reset.
      await txn.runAsync(
        'INSERT INTO app_state (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING',
        'player', JSON.stringify(createNewPlayer('GRACZ'))
      );
      snapshot = await snapshotInTransaction(txn);
    });
    if (!snapshot) throw new Error('Nie udało się odczytać zapisu SYSTEMU.');
    return snapshot;
  });
}

export function acknowledgeAwakening() {
  return serialized(async () => {
    await initSystemDatabase();
    const db = await getDatabase();
    await db.withExclusiveTransactionAsync(async txn => {
      const snapshot = await snapshotInTransaction(txn);
      if (!snapshot.awakeningCompleted) throw new Error('Przebudzenie nie zostało ukończone.');
      await txn.runAsync(
        'INSERT INTO app_state (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING',
        'awakening_presentation_seen', 'true'
      );
    });
  });
}
