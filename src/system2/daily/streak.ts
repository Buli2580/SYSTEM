import { dayKey, dayOrdinal, DAILY_RULES } from './calendar';

export const STREAK_MILESTONES = [3, 7, 14, 30] as const;

export type StreakMilestone = typeof STREAK_MILESTONES[number];

export type StreakState = {
  currentStreak: number;
  bestStreak: number;
  lastQualifyingDay: string | null;
  isTodayComplete: boolean;
  nextMilestone: StreakMilestone | null;
  progressToNextMilestone: number;
  newlyReachedMilestone: StreakMilestone | null;
};

export function calculateStreakState(
  currentStreak: number,
  bestStreak: number,
  lastQualifyingDay: string | null,
  today: string,
  dailyState: { clear: boolean } | null
): StreakState {
  const isTodayComplete = dailyState?.clear ?? false;

  let effectiveCurrentStreak = currentStreak;
  let effectiveBestStreak = bestStreak;
  let effectiveLastQualifyingDay = lastQualifyingDay;

  if (isTodayComplete) {
    if (effectiveLastQualifyingDay === today) {
      // Already counted today
    } else if (effectiveLastQualifyingDay && dayOrdinal(today) - dayOrdinal(effectiveLastQualifyingDay) === 1) {
      // Consecutive day
      effectiveCurrentStreak += 1;
      effectiveLastQualifyingDay = today;
    } else if (!effectiveLastQualifyingDay || dayOrdinal(today) - dayOrdinal(effectiveLastQualifyingDay) > 1) {
      // Streak broken or first day
      effectiveCurrentStreak = 1;
      effectiveLastQualifyingDay = today;
    }
    if (effectiveCurrentStreak > effectiveBestStreak) {
      effectiveBestStreak = effectiveCurrentStreak;
    }
  }

  const nextMilestone = STREAK_MILESTONES.find(m => m > effectiveCurrentStreak) ?? null;
  const progressToNextMilestone = nextMilestone
    ? Math.round((effectiveCurrentStreak / nextMilestone) * 100)
    : 100;

  const newlyReachedMilestone = STREAK_MILESTONES.find(
    m => m <= effectiveCurrentStreak && m > currentStreak
  ) ?? null;

  return {
    currentStreak: effectiveCurrentStreak,
    bestStreak: effectiveBestStreak,
    lastQualifyingDay: effectiveLastQualifyingDay,
    isTodayComplete,
    nextMilestone,
    progressToNextMilestone,
    newlyReachedMilestone,
  };
}

export function getMilestoneReward(milestone: StreakMilestone): { realXp: number; energy: number } {
  const baseXp = 50;
  const baseEnergy = 5;
  const multiplier = Math.sqrt(milestone / 3);
  return {
    realXp: Math.round(baseXp * multiplier),
    energy: Math.round(baseEnergy * multiplier),
  };
}

export function getStreakStatusText(state: StreakState): string {
  if (state.currentStreak === 0) {
    return 'NO STREAK';
  }
  const milestoneText = state.nextMilestone
    ? ` · NEXT: ${state.nextMilestone} DAYS (${state.progressToNextMilestone}%)`
    : ' · MAX MILESTONE REACHED';
  return `${state.currentStreak} DAY STREAK${milestoneText}`;
}