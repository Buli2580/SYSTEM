import type { SQLiteDatabase } from 'expo-sqlite';
import type { Goal, GoalMilestone, GoalPhase, GoalJournalEntry, QuestFeedback, DifficultyAdjustment, DifficultyAdjustmentSignal, PlayerPreferenceProfile, PreferenceValue, LearnedPreference, AdaptiveDifficultyState } from '../goals/types';
import { dayKey } from '../daily/calendar';

function rowToGoal(row: any): Goal {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    customTypeName: row.custom_type_name ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    targetDate: row.target_date ?? undefined,
    priority: row.priority,
    status: row.status,
    difficulty: row.difficulty,
    motivation: row.motivation,
    preferredSchedule: JSON.parse(row.preferred_schedule),
    preferredFrequency: row.preferred_frequency ?? 0,
    preferredTimeCommitment: row.preferred_time_commitment ?? 0,
    constraints: JSON.parse(row.constraints),
    progress: row.progress,
    progressTarget: row.progress_target,
    unit: row.unit ?? '',
    milestones: JSON.parse(row.milestones),
    phases: JSON.parse(row.phases),
    linkedQuestIds: JSON.parse(row.linked_quest_ids),
    linkedStatIds: JSON.parse(row.linked_stat_ids),
    primary: Boolean(row.primary),
    startedAt: row.started_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    archivedAt: row.archived_at ?? undefined,
    pausedAt: row.paused_at ?? undefined,
    pausedReason: row.paused_reason ?? undefined,
  };
}

function rowToJournalEntry(row: any): GoalJournalEntry {
  return {
    id: row.id,
    goalId: row.goal_id,
    type: row.type,
    title: row.title,
    description: row.description,
    timestamp: row.timestamp,
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
  };
}

function rowToQuestFeedback(row: any): QuestFeedback {
  return {
    id: row.id,
    questId: row.quest_id,
    questTitle: row.quest_title,
    type: row.type,
    difficultyRating: row.difficulty_rating,
    enjoymentRating: row.enjoyment_rating,
    comment: row.comment ?? undefined,
    createdAt: row.created_at,
    usedForRecommendations: Boolean(row.used_for_recommendations),
  };
}

function rowToDifficultyAdjustment(row: any): DifficultyAdjustment {
  return {
    id: row.id,
    timestamp: row.timestamp,
    previousDifficulty: row.previous_difficulty,
    newDifficulty: row.new_difficulty,
    reason: row.reason,
    signals: JSON.parse(row.signals),
    applied: Boolean(row.applied),
  };
}

export async function createGoal(db: SQLiteDatabase, goal: Goal): Promise<void> {
  await db.runAsync(
    `INSERT INTO player_goals (id, type, title, description, custom_type_name, created_at, updated_at, target_date, priority, status, difficulty, motivation, preferred_schedule, preferred_frequency, preferred_time_commitment, constraints, progress, progress_target, unit, milestones, phases, linked_quest_ids, linked_stat_ids, primary, started_at, completed_at, archived_at, paused_at, paused_reason)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    goal.id,
    goal.type,
    goal.title,
    goal.description,
    goal.customTypeName ?? null,
    goal.createdAt,
    goal.updatedAt,
    goal.targetDate ?? null,
    goal.priority,
    goal.status,
    goal.difficulty,
    goal.motivation,
    JSON.stringify(goal.preferredSchedule),
    goal.preferredFrequency,
    goal.preferredTimeCommitment,
    JSON.stringify(goal.constraints),
    goal.progress,
    goal.progressTarget,
    goal.unit,
    JSON.stringify(goal.milestones),
    JSON.stringify(goal.phases),
    JSON.stringify(goal.linkedQuestIds),
    JSON.stringify(goal.linkedStatIds),
    goal.primary ? 1 : 0,
    goal.startedAt ?? null,
    goal.completedAt ?? null,
    goal.archivedAt ?? null,
    goal.pausedAt ?? null,
    goal.pausedReason ?? null
  );
}

export async function updateGoal(db: SQLiteDatabase, goal: Goal): Promise<void> {
  await db.runAsync(
    `UPDATE player_goals SET
      type = ?, title = ?, description = ?, custom_type_name = ?, updated_at = ?, target_date = ?, priority = ?, status = ?, difficulty = ?, motivation = ?, preferred_schedule = ?, preferred_frequency = ?, preferred_time_commitment = ?, constraints = ?, progress = ?, progress_target = ?, unit = ?, milestones = ?, phases = ?, linked_quest_ids = ?, linked_stat_ids = ?, primary = ?, started_at = ?, completed_at = ?, archived_at = ?, paused_at = ?, paused_reason = ?
     WHERE id = ?`,
    goal.type,
    goal.title,
    goal.description,
    goal.customTypeName ?? null,
    goal.updatedAt,
    goal.targetDate ?? null,
    goal.priority,
    goal.status,
    goal.difficulty,
    goal.motivation,
    JSON.stringify(goal.preferredSchedule),
    goal.preferredFrequency,
    goal.preferredTimeCommitment,
    JSON.stringify(goal.constraints),
    goal.progress,
    goal.progressTarget,
    goal.unit,
    JSON.stringify(goal.milestones),
    JSON.stringify(goal.phases),
    JSON.stringify(goal.linkedQuestIds),
    JSON.stringify(goal.linkedStatIds),
    goal.primary ? 1 : 0,
    goal.startedAt ?? null,
    goal.completedAt ?? null,
    goal.archivedAt ?? null,
    goal.pausedAt ?? null,
    goal.pausedReason ?? null,
    goal.id
  );
}

export async function archiveGoal(db: SQLiteDatabase, goalId: string, reason?: string): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE player_goals SET status = 'ARCHIVED', updated_at = ?, archived_at = ?, paused_reason = ? WHERE id = ?`,
    now, now, reason ?? null, goalId
  );
}

export async function pauseGoal(db: SQLiteDatabase, goalId: string, reason?: string): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE player_goals SET status = 'PAUSED', updated_at = ?, paused_at = ?, paused_reason = ? WHERE id = ?`,
    now, now, reason ?? null, goalId
  );
}

export async function resumeGoal(db: SQLiteDatabase, goalId: string): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE player_goals SET status = 'ACTIVE', updated_at = ?, paused_at = NULL, paused_reason = NULL WHERE id = ?`,
    now, goalId
  );
}

export async function loadActiveGoals(db: SQLiteDatabase): Promise<Goal[]> {
  const rows = await db.getAllAsync<{ id: string; type: string; title: string; description: string; custom_type_name: string | null; created_at: string; updated_at: string; target_date: string | null; priority: string; status: string; difficulty: string; motivation: string; preferred_schedule: string; preferred_frequency: number; preferred_time_commitment: number; constraints: string; progress: number; progress_target: number; unit: string; milestones: string; phases: string; linked_quest_ids: string; linked_stat_ids: string; primary: number; started_at: string | null; completed_at: string | null; archived_at: string | null; paused_at: string | null; paused_reason: string | null }>(
    `SELECT * FROM player_goals WHERE status IN ('ACTIVE', 'PAUSED') ORDER BY primary DESC, created_at ASC`
  );
  return rows.map(rowToGoal);
}

export async function loadAllGoals(db: SQLiteDatabase): Promise<Goal[]> {
  const rows = await db.getAllAsync<{ id: string; type: string; title: string; description: string; custom_type_name: string | null; created_at: string; updated_at: string; target_date: string | null; priority: string; status: string; difficulty: string; motivation: string; preferred_schedule: string; preferred_frequency: number; preferred_time_commitment: number; constraints: string; progress: number; progress_target: number; unit: string; milestones: string; phases: string; linked_quest_ids: string; linked_stat_ids: string; primary: number; started_at: string | null; completed_at: string | null; archived_at: string | null; paused_at: string | null; paused_reason: string | null }>(
    `SELECT * FROM player_goals ORDER BY primary DESC, created_at ASC`
  );
  return rows.map(rowToGoal);
}

export async function loadPrimaryGoal(db: SQLiteDatabase): Promise<Goal | null> {
  const row = await db.getFirstAsync<{ id: string; type: string; title: string; description: string; custom_type_name: string | null; created_at: string; updated_at: string; target_date: string | null; priority: string; status: string; difficulty: string; motivation: string; preferred_schedule: string; preferred_frequency: number; preferred_time_commitment: number; constraints: string; progress: number; progress_target: number; unit: string; milestones: string; phases: string; linked_quest_ids: string; linked_stat_ids: string; primary: number; started_at: string | null; completed_at: string | null; archived_at: string | null; paused_at: string | null; paused_reason: string | null }>(
    `SELECT * FROM player_goals WHERE primary = 1 AND status IN ('ACTIVE', 'PAUSED') ORDER BY created_at ASC LIMIT 1`
  );
  return row ? rowToGoal(row) : null;
}

export async function loadGoal(db: SQLiteDatabase, goalId: string): Promise<Goal | null> {
  const row = await db.getFirstAsync<{ id: string; type: string; title: string; description: string; custom_type_name: string | null; created_at: string; updated_at: string; target_date: string | null; priority: string; status: string; difficulty: string; motivation: string; preferred_schedule: string; preferred_frequency: number; preferred_time_commitment: number; constraints: string; progress: number; progress_target: number; unit: string; milestones: string; phases: string; linked_quest_ids: string; linked_stat_ids: string; primary: number; started_at: string | null; completed_at: string | null; archived_at: string | null; paused_at: string | null; paused_reason: string | null }>(
    `SELECT * FROM player_goals WHERE id = ?`, goalId
  );
  return row ? rowToGoal(row) : null;
}

export async function setPrimaryGoal(db: SQLiteDatabase, goalId: string): Promise<void> {
  const now = new Date().toISOString();
  await db.withExclusiveTransactionAsync(async txn => {
    await txn.runAsync(`UPDATE player_goals SET primary = 0, updated_at = ? WHERE primary = 1`, now);
    await txn.runAsync(`UPDATE player_goals SET primary = 1, updated_at = ? WHERE id = ?`, now, goalId);
  });
}

export async function updateGoalProgress(db: SQLiteDatabase, goalId: string, progress: number): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE player_goals SET progress = ?, updated_at = ? WHERE id = ?`,
    progress, now, goalId
  );
}

export async function addGoalJournalEntry(db: SQLiteDatabase, entry: GoalJournalEntry): Promise<void> {
  await db.runAsync(
    `INSERT INTO goal_journal (id, goal_id, type, title, description, timestamp, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    entry.id,
    entry.goalId,
    entry.type,
    entry.title,
    entry.description,
    entry.timestamp,
    entry.metadata ? JSON.stringify(entry.metadata) : null
  );
}

export async function loadGoalJournal(db: SQLiteDatabase, goalId: string, limit = 50): Promise<GoalJournalEntry[]> {
  const rows = await db.getAllAsync<{ id: string; goal_id: string; type: string; title: string; description: string; timestamp: string; metadata: string | null }>(
    `SELECT * FROM goal_journal WHERE goal_id = ? ORDER BY timestamp DESC LIMIT ?`, goalId, limit
  );
  return rows.map(rowToJournalEntry);
}

export async function saveQuestFeedback(db: SQLiteDatabase, feedback: QuestFeedback): Promise<void> {
  await db.runAsync(
    `INSERT INTO quest_feedback (id, quest_id, quest_title, type, difficulty_rating, enjoyment_rating, comment, created_at, used_for_recommendations)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    feedback.id,
    feedback.questId,
    feedback.questTitle,
    feedback.type,
    feedback.difficultyRating,
    feedback.enjoymentRating,
    feedback.comment ?? null,
    feedback.createdAt,
    feedback.usedForRecommendations ? 1 : 0
  );
}

export async function loadQuestFeedback(db: SQLiteDatabase, questId: string): Promise<QuestFeedback[]> {
  const rows = await db.getAllAsync<{ id: string; quest_id: string; quest_title: string; type: string; difficulty_rating: number; enjoyment_rating: number; comment: string | null; created_at: string; used_for_recommendations: number }>(
    `SELECT * FROM quest_feedback WHERE quest_id = ? ORDER BY created_at DESC`, questId
  );
  return rows.map(rowToQuestFeedback);
}

export async function saveDifficultyAdjustment(db: SQLiteDatabase, adjustment: DifficultyAdjustment): Promise<void> {
  await db.runAsync(
    `INSERT INTO difficulty_adjustments (id, timestamp, previous_difficulty, new_difficulty, reason, signals, applied)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    adjustment.id,
    adjustment.timestamp,
    adjustment.previousDifficulty,
    adjustment.newDifficulty,
    adjustment.reason,
    JSON.stringify(adjustment.signals),
    adjustment.applied ? 1 : 0
  );
}

export async function loadDifficultyAdjustments(db: SQLiteDatabase, limit = 20): Promise<DifficultyAdjustment[]> {
  const rows = await db.getAllAsync<{ id: string; timestamp: string; previous_difficulty: string; new_difficulty: string; reason: string; signals: string; applied: number }>(
    `SELECT * FROM difficulty_adjustments ORDER BY timestamp DESC LIMIT ?`, limit
  );
  return rows.map(rowToDifficultyAdjustment);
}

export async function savePlayerPreference(db: SQLiteDatabase, key: string, value: string | number | boolean | string[], explicit: boolean): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO player_preferences (key, value, explicit, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, explicit = excluded.explicit, updated_at = excluded.updated_at`,
    key, JSON.stringify(value), explicit ? 1 : 0, now
  );
}

export async function loadPlayerPreferences(db: SQLiteDatabase): Promise<PreferenceValue[]> {
  const rows = await db.getAllAsync<{ key: string; value: string; explicit: number; updated_at: string }>(
    `SELECT * FROM player_preferences`
  );
  return rows.map(r => ({
    key: r.key as any,
    value: JSON.parse(r.value),
    explicit: Boolean(r.explicit),
    updatedAt: r.updated_at,
  }));
}

export async function saveLearnedPreference(db: SQLiteDatabase, key: string, value: string | number | boolean | string[], confidence: number, sampleCount: number): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO learned_preferences (key, value, confidence, sample_count, last_updated) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, confidence = excluded.confidence, sample_count = excluded.sample_count, last_updated = excluded.last_updated`,
    key, JSON.stringify(value), confidence, sampleCount, now
  );
}

export async function loadLearnedPreferences(db: SQLiteDatabase): Promise<LearnedPreference[]> {
  const rows = await db.getAllAsync<{ key: string; value: string; confidence: number; sample_count: number; last_updated: string }>(
    `SELECT * FROM learned_preferences`
  );
  return rows.map(r => ({
    key: r.key,
    value: JSON.parse(r.value),
    confidence: r.confidence,
    sampleCount: r.sample_count,
    lastUpdated: r.last_updated,
  }));
}

export async function getAdaptiveDifficultyState(db: SQLiteDatabase, goalId: string): Promise<AdaptiveDifficultyState | null> {
  const goal = await loadGoal(db, goalId);
  if (!goal) return null;

  const adjustments = await loadDifficultyAdjustments(db, 50);
  const goalAdjustments = adjustments.filter(a => a.id.startsWith(goalId));

  const recentCompletions = goalAdjustments.filter(a => a.signals.some(s => s.type === 'QUEST_COMPLETION_RATE'));
  const streak = goalAdjustments.filter(a => a.signals.some(s => s.type === 'RECENT_STREAK')).length;
  const completionRate = recentCompletions.length > 0
    ? recentCompletions.reduce((sum, a) => {
        const signal = a.signals.find(s => s.type === 'QUEST_COMPLETION_RATE');
        return sum + (signal?.value ?? 0);
      }, 0) / recentCompletions.length
    : 0.5;

  return {
    currentDifficulty: goal.difficulty,
    lastAdjustmentAt: goalAdjustments[0]?.timestamp,
    adjustments: goalAdjustments,
    streak,
    completionRate,
    abandonedCount: goalAdjustments.filter(a => a.signals.some(s => s.type === 'ABANDONED_QUESTS')).length,
    verificationFailureRate: goalAdjustments.filter(a => a.signals.some(s => s.type === 'VERIFICATION_FAILURES')).length / Math.max(1, goalAdjustments.length),
    avgTimeToCompletion: 0,
    goalProgress: goal.progress,
  };
}