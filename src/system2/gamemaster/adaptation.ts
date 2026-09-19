// SYSTEM 2.0 — DIFFICULTY ADAPTATION
// Handles adaptive difficulty based on player performance

import type {
  GoalDifficulty,
  DifficultyAdjustmentSignalType,
  DifficultyAdjustmentSignalData,
  AdaptiveDifficultyState,
  GameMasterContext,
  DifficultyAdjustmentSuggestion,
  Goal,
} from './types';

const DIFFICULTY_ORDER: GoalDifficulty[] = ['EASY', 'NORMAL', 'HARD', 'EXTREME'];

const ADAPTATION_THRESHOLDS = {
  completionRate: {
    increase: 0.85,
    decrease: 0.45,
  },
  streak: {
    increase: 7,
    decrease: 0,
  },
  abandonmentRate: {
    increase: 0.1,
    decrease: 0.3,
  },
  verificationFailureRate: {
    increase: 0.1,
    decrease: 0.25,
  },
  inactivityDays: {
    easyComeback: 3,
    reducedDifficulty: 7,
  },
};

const MIN_ADJUSTMENT_INTERVAL_HOURS = 24;
const MAX_DIFFICULTY_STEP = 1;

function difficultyToIndex(difficulty: GoalDifficulty): number {
  return DIFFICULTY_ORDER.indexOf(difficulty);
}

function indexToDifficulty(index: number): GoalDifficulty {
  const clamped = Math.max(0, Math.min(DIFFICULTY_ORDER.length - 1, index));
  return DIFFICULTY_ORDER[clamped];
}

function calculateSignals(context: GameMasterContext, goal: Goal): DifficultyAdjustmentSignalData[] {
  const signals: DifficultyAdjustmentSignalData[] = [];
  const now = new Date();
  const recentHistory = context.recentQuestHistory.filter(
    h => new Date(h.completedAt).getTime() > now.getTime() - 14 * 24 * 60 * 60 * 1000
  );

  const goalQuests = recentHistory.filter(h => 
    goal.linkedQuestIds.includes(h.questId) || 
    (context.primaryGoal?.id === goal.id && h.category !== 'BOSS')
  );

  const totalAttempts = goalQuests.length;
  const completions = goalQuests.filter(h => h.verificationType !== 'REJECTED').length;
  const completionRate = totalAttempts > 0 ? completions / totalAttempts : 0.5;

  signals.push({
    type: 'QUEST_COMPLETION_RATE',
    value: completionRate,
    threshold: ADAPTATION_THRESHOLDS.completionRate.increase,
    description: `Quest completion rate: ${Math.round(completionRate * 100)}%`,
  });

  signals.push({
    type: 'RECENT_STREAK',
    value: context.streak,
    threshold: ADAPTATION_THRESHOLDS.streak.increase,
    description: `Current streak: ${context.streak} days`,
  });

  const abandonedCount = recentHistory.filter(h => h.verificationType === 'ABANDONED').length;
  const abandonmentRate = totalAttempts > 0 ? abandonedCount / totalAttempts : 0;
  signals.push({
    type: 'ABANDONED_QUESTS',
    value: abandonmentRate,
    threshold: ADAPTATION_THRESHOLDS.abandonmentRate.decrease,
    description: `Quest abandonment rate: ${Math.round(abandonmentRate * 100)}%`,
  });

  const verificationFailures = recentHistory.filter(h => h.verificationType === 'FAILED' || h.verificationType === 'REJECTED').length;
  const failureRate = totalAttempts > 0 ? verificationFailures / totalAttempts : 0;
  signals.push({
    type: 'VERIFICATION_FAILURES',
    value: failureRate,
    threshold: ADAPTATION_THRESHOLDS.verificationFailureRate.decrease,
    description: `Verification failure rate: ${Math.round(failureRate * 100)}%`,
  });

  const goalProgress = goal.progress / goal.progressTarget;
  signals.push({
    type: 'GOAL_PROGRESS',
    value: goalProgress,
    threshold: 1.0,
    description: `Goal progress: ${Math.round(goalProgress * 100)}%`,
  });

  const lastQuest = recentHistory[0];
  let inactivityDays = 999;
  if (lastQuest) {
    const diff = now.getTime() - new Date(lastQuest.completedAt).getTime();
    inactivityDays = Math.floor(diff / (24 * 60 * 60 * 1000));
  }
  signals.push({
    type: 'TIME_TO_COMPLETION',
    value: inactivityDays,
    threshold: ADAPTATION_THRESHOLDS.inactivityDays.easyComeback,
    description: `Days since last quest: ${inactivityDays}`,
  });

  return signals;
}

function evaluateDifficultyChange(
  currentDifficulty: GoalDifficulty,
  signals: DifficultyAdjustmentSignalData[]
): { newDifficulty: GoalDifficulty; reason: string; triggeredSignals: DifficultyAdjustmentSignalData[] } {
  const currentIndex = difficultyToIndex(currentDifficulty);
  let targetIndex = currentIndex;
  const triggered: DifficultyAdjustmentSignalData[] = [];
  const reasons: string[] = [];

  const completionRateSignal = signals.find(s => s.type === 'QUEST_COMPLETION_RATE');
  const streakSignal = signals.find(s => s.type === 'RECENT_STREAK');
  const abandonmentSignal = signals.find(s => s.type === 'ABANDONED_QUESTS');
  const failureSignal = signals.find(s => s.type === 'VERIFICATION_FAILURES');
  const inactivitySignal = signals.find(s => s.type === 'TIME_TO_COMPLETION');
  const progressSignal = signals.find(s => s.type === 'GOAL_PROGRESS');

  if (completionRateSignal && completionRateSignal.value >= ADAPTATION_THRESHOLDS.completionRate.increase) {
    targetIndex = Math.min(targetIndex + 1, DIFFICULTY_ORDER.length - 1);
    triggered.push(completionRateSignal);
    reasons.push('High completion rate');
  }

  if (streakSignal && streakSignal.value >= ADAPTATION_THRESHOLDS.streak.increase) {
    targetIndex = Math.min(targetIndex + 1, DIFFICULTY_ORDER.length - 1);
    triggered.push(streakSignal);
    reasons.push(`Strong streak (${streakSignal.value} days)`);
  }

  if (abandonmentSignal && abandonmentSignal.value >= ADAPTATION_THRESHOLDS.abandonmentRate.decrease) {
    targetIndex = Math.max(targetIndex - 1, 0);
    triggered.push(abandonmentSignal);
    reasons.push('High abandonment rate');
  }

  if (failureSignal && failureSignal.value >= ADAPTATION_THRESHOLDS.verificationFailureRate.decrease) {
    targetIndex = Math.max(targetIndex - 1, 0);
    triggered.push(failureSignal);
    reasons.push('High verification failure rate');
  }

  if (inactivitySignal && inactivitySignal.value >= ADAPTATION_THRESHOLDS.inactivityDays.reducedDifficulty) {
    targetIndex = Math.max(targetIndex - 1, 0);
    triggered.push(inactivitySignal);
    reasons.push(`Inactive for ${inactivitySignal.value} days`);
  } else if (inactivitySignal && inactivitySignal.value >= ADAPTATION_THRESHOLDS.inactivityDays.easyComeback) {
    targetIndex = Math.max(targetIndex - 1, 0);
    triggered.push(inactivitySignal);
    reasons.push(`Inactive for ${inactivitySignal.value} days - comeback mode`);
  }

  if (progressSignal && progressSignal.value >= 0.9) {
    targetIndex = Math.min(targetIndex + 1, DIFFICULTY_ORDER.length - 1);
    triggered.push(progressSignal);
    reasons.push('Goal near completion');
  }

  const step = Math.max(-MAX_DIFFICULTY_STEP, Math.min(MAX_DIFFICULTY_STEP, targetIndex - currentIndex));
  const finalIndex = currentIndex + step;

  return {
    newDifficulty: indexToDifficulty(finalIndex),
    reason: reasons.length > 0 ? reasons.join('; ') : 'Stable performance',
    triggeredSignals: triggered,
  };
}

export function shouldAdjustDifficulty(
  context: GameMasterContext,
  goal: Goal,
  lastAdjustmentAt?: string
): boolean {
  if (!lastAdjustmentAt) return true;
  const hoursSinceLastAdjustment = (Date.now() - new Date(lastAdjustmentAt).getTime()) / (1000 * 60 * 60);
  if (hoursSinceLastAdjustment < MIN_ADJUSTMENT_INTERVAL_HOURS) return false;

  const signals = calculateSignals(context, goal);
  const { newDifficulty } = evaluateDifficultyChange(goal.difficulty, signals);
  return newDifficulty !== goal.difficulty;
}

export function generateDifficultyAdjustment(
  context: GameMasterContext,
  goal: Goal,
  lastAdjustmentAt?: string
): DifficultyAdjustmentSuggestion | null {
  const signals = calculateSignals(context, goal);
  const { newDifficulty, reason, triggeredSignals } = evaluateDifficultyChange(goal.difficulty, signals);

  if (newDifficulty === goal.difficulty) {
    return null;
  }

  return {
    type: 'DIFFICULTY_ADJUSTMENT',
    adjustment: newDifficulty,
    previousDifficulty: goal.difficulty,
    signals: triggeredSignals,
    reason,
  };
}

export function applyDifficultyAdjustment(goal: Goal, suggestion: DifficultyAdjustmentSuggestion): Goal {
  return {
    ...goal,
    difficulty: suggestion.adjustment,
    updatedAt: new Date().toISOString(),
  };
}

export function getComebackQuestDifficulty(daysInactive: number): GoalDifficulty {
  if (daysInactive >= 14) return 'EASY';
  if (daysInactive >= 7) return 'EASY';
  if (daysInactive >= 3) return 'NORMAL';
  return 'NORMAL';
}

export function getChallengeQuestDifficulty(streak: number, currentDifficulty: GoalDifficulty): GoalDifficulty {
  const currentIndex = difficultyToIndex(currentDifficulty);
  if (streak >= 14) return indexToDifficulty(Math.min(currentIndex + 1, DIFFICULTY_ORDER.length - 1));
  if (streak >= 7) return indexToDifficulty(Math.min(currentIndex + 1, DIFFICULTY_ORDER.length - 1));
  return currentDifficulty;
}

export function calculateAdaptiveState(
  context: GameMasterContext,
  goal: Goal,
  adjustments: Array<{ id: string; timestamp: string; previousDifficulty: GoalDifficulty; newDifficulty: GoalDifficulty; reason: string; signals: DifficultyAdjustmentSignalData[]; applied: boolean }>
): AdaptiveDifficultyState {
  const recentHistory = context.recentQuestHistory.filter(
    h => new Date(h.completedAt).getTime() > Date.now() - 14 * 24 * 60 * 60 * 1000
  );

  const goalQuests = recentHistory.filter(h => 
    goal.linkedQuestIds.includes(h.questId) || 
    (context.primaryGoal?.id === goal.id && h.category !== 'BOSS')
  );

  const totalAttempts = goalQuests.length;
  const completions = goalQuests.filter(h => h.verificationType !== 'REJECTED').length;
  const completionRate = totalAttempts > 0 ? completions / totalAttempts : 0.5;

  const abandonedCount = recentHistory.filter(h => h.verificationType === 'ABANDONED').length;
  const verificationFailures = recentHistory.filter(h => h.verificationType === 'FAILED' || h.verificationType === 'REJECTED').length;

  let totalDuration = 0;
  let completedWithDuration = 0;
  for (const h of goalQuests) {
    if (h.verificationType !== 'REJECTED') {
      totalDuration += h.durationSeconds ?? 0;
      completedWithDuration++;
    }
  }
  const avgTimeToCompletion = completedWithDuration > 0 ? totalDuration / completedWithDuration : 0;

  return {
    currentDifficulty: goal.difficulty,
    lastAdjustmentAt: adjustments[0]?.timestamp,
    adjustments,
    streak: context.streak,
    completionRate,
    abandonedCount,
    verificationFailureRate: totalAttempts > 0 ? verificationFailures / totalAttempts : 0,
    avgTimeToCompletion,
    goalProgress: goal.progress / goal.progressTarget,
  };
}