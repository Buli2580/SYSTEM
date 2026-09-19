import * as SQLite from 'expo-sqlite';
import type { FieldQuestSession, FieldQuestEvidence, FieldQuestRestoreData } from './types';

const TABLE_SESSIONS = 'field_quest_sessions';
const TABLE_EVIDENCE = 'field_quest_evidence';

export async function initFieldQuestDatabase(): Promise<void> {
  const db = await getDatabase();
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.execAsync(`
      CREATE TABLE IF NOT EXISTS ${TABLE_SESSIONS} (
        id TEXT PRIMARY KEY NOT NULL,
        quest_id TEXT NOT NULL,
        quest_title TEXT NOT NULL,
        verification_mode TEXT NOT NULL,
        requirements TEXT NOT NULL,
        status TEXT NOT NULL,
        progress TEXT NOT NULL,
        evidence TEXT,
        started_at INTEGER NOT NULL,
        paused_at INTEGER,
        completed_at INTEGER,
        paused_duration INTEGER NOT NULL DEFAULT 0,
        reward_claimed INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_field_quest_status ON ${TABLE_SESSIONS}(status);
      CREATE INDEX IF NOT EXISTS idx_field_quest_quest ON ${TABLE_SESSIONS}(quest_id);
    `);

    await txn.execAsync(`
      CREATE TABLE IF NOT EXISTS ${TABLE_EVIDENCE} (
        id TEXT PRIMARY KEY NOT NULL,
        session_id TEXT NOT NULL,
        quest_id TEXT NOT NULL,
        distance_meters REAL NOT NULL,
        duration_seconds REAL NOT NULL,
        sample_count INTEGER NOT NULL,
        verification_score INTEGER NOT NULL,
        verification_mode TEXT NOT NULL,
        activity_evidence TEXT,
        gps_samples TEXT NOT NULL,
        reason_codes TEXT NOT NULL,
        verdict TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_evidence_session ON ${TABLE_EVIDENCE}(session_id);
    `);
  });
}

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

export async function saveFieldQuestSession(session: FieldQuestSession): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO ${TABLE_SESSIONS} (id, quest_id, quest_title, verification_mode, requirements, status, progress, evidence, started_at, paused_at, completed_at, paused_duration, reward_claimed, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       status = excluded.status,
       progress = excluded.progress,
       evidence = excluded.evidence,
       paused_at = excluded.paused_at,
       completed_at = excluded.completed_at,
       paused_duration = excluded.paused_duration,
       reward_claimed = excluded.reward_claimed,
       updated_at = excluded.updated_at`,
    session.id,
    session.questId,
    session.questTitle,
    session.verificationMode,
    JSON.stringify(session.requirements),
    session.status,
    JSON.stringify(session.progress),
    session.evidence ? JSON.stringify(session.evidence) : null,
    session.startedAt,
    session.pausedAt,
    session.completedAt,
    session.pausedDuration,
    session.rewardClaimed ? 1 : 0,
    session.startedAt,
    Date.now()
  );
}

export async function loadActiveFieldQuestSession(): Promise<FieldQuestRestoreData | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: string;
    quest_id: string;
    status: string;
    progress: string;
    evidence: string | null;
    started_at: number;
    paused_at: number | null;
    paused_duration: number;
    evidence_json: string | null;
  }>(
    `SELECT id, quest_id, status, progress, evidence, started_at, paused_at, paused_duration, evidence
     FROM ${TABLE_SESSIONS}
     WHERE status IN ('ACTIVE', 'PAUSED', 'VERIFYING')
     ORDER BY updated_at DESC
     LIMIT 1`
  );

  if (!row) return null;

  const evidence = row.evidence ? JSON.parse(row.evidence) : null;
  const progress = JSON.parse(row.progress);

  return {
    sessionId: row.id,
    questId: row.quest_id,
    status: row.status as any,
    progress,
    startedAt: row.started_at,
    pausedAt: row.paused_at,
    pausedDuration: row.paused_duration,
    evidence: evidence,
  };
}

export async function loadFieldQuestSession(id: string): Promise<FieldQuestSession | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: string;
    quest_id: string;
    quest_title: string;
    verification_mode: string;
    requirements: string;
    status: string;
    progress: string;
    evidence: string | null;
    started_at: number;
    paused_at: number | null;
    completed_at: number | null;
    paused_duration: number;
    reward_claimed: number;
  }>(`SELECT * FROM ${TABLE_SESSIONS} WHERE id = ?`, id);

  if (!row) return null;

  return {
    id: row.id,
    questId: row.quest_id,
    questTitle: row.quest_title,
    verificationMode: row.verification_mode as any,
    requirements: JSON.parse(row.requirements),
    status: row.status as any,
    progress: JSON.parse(row.progress),
    evidence: row.evidence ? JSON.parse(row.evidence) : undefined,
    startedAt: row.started_at,
    pausedAt: row.paused_at,
    completedAt: row.completed_at,
    pausedDuration: row.paused_duration,
    rewardClaimed: row.reward_claimed === 1,
  };
}

export async function saveFieldQuestEvidence(evidence: FieldQuestEvidence): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO ${TABLE_EVIDENCE} (id, session_id, quest_id, distance_meters, duration_seconds, sample_count, verification_score, verification_mode, activity_evidence, gps_samples, reason_codes, verdict, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       distance_meters = excluded.distance_meters,
       duration_seconds = excluded.duration_seconds,
       sample_count = excluded.sample_count,
       verification_score = excluded.verification_score,
       verification_mode = excluded.verification_mode,
       activity_evidence = excluded.activity_evidence,
       gps_samples = excluded.gps_samples,
       reason_codes = excluded.reason_codes,
       verdict = excluded.verdict`,
    `evidence_${evidence.sessionId}`,
    evidence.sessionId,
    evidence.questId,
    evidence.distanceMeters,
    evidence.durationSeconds,
    evidence.sampleCount,
    evidence.verificationScore,
    evidence.verificationMode,
    evidence.activityEvidence ? JSON.stringify(evidence.activityEvidence) : null,
    JSON.stringify(evidence.gpsSamples),
    JSON.stringify(evidence.reasonCodes),
    evidence.verdict,
    Date.now()
  );
}

export async function markSessionRewardClaimed(sessionId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE ${TABLE_SESSIONS} SET reward_claimed = 1, updated_at = ? WHERE id = ?`,
    Date.now(),
    sessionId
  );
}

export async function clearActiveFieldQuestSessions(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE ${TABLE_SESSIONS} SET status = 'CANCELLED', completed_at = ?, updated_at = ? WHERE status IN ('ACTIVE', 'PAUSED', 'VERIFYING')`,
    Date.now(),
    Date.now()
  );
}