import { dayOrdinal, nextStreak } from './calendar';

// Reward curve and thresholds recovered from agent/local a70cb81f.
export const STREAK_MILESTONES = [3, 7, 14, 30] as const;
export type StreakMilestone = typeof STREAK_MILESTONES[number];
export type StreakState = {
  currentStreak: number; bestStreak: number; lastQualifyingDay: string | null;
  isTodayComplete: boolean; nextMilestone: StreakMilestone | null;
  progressToNextMilestone: number; newlyReachedMilestone: StreakMilestone | null;
  clockAnomaly: boolean;
};

/** Display calculation only. The persisted daily_clear ledger owns streak advancement. */
export function calculateStreakState(currentStreak: number, bestStreak: number,
  lastQualifyingDay: string | null, today: string, daily: { clear: boolean } | null): StreakState {
  const gap = lastQualifyingDay ? dayOrdinal(today) - dayOrdinal(lastQualifyingDay) : null;
  const clockAnomaly = gap !== null && gap < 0;
  const isTodayComplete = !clockAnomaly && Boolean(daily?.clear);
  let effective = gap !== null && gap > 1 ? 0 : currentStreak;
  if (isTodayComplete && lastQualifyingDay !== today) {
    effective = nextStreak(lastQualifyingDay ?? undefined, today, currentStreak);
    lastQualifyingDay = today;
  }
  const nextMilestone = STREAK_MILESTONES.find(m => m > effective) ?? null;
  return {
    currentStreak: effective, bestStreak: Math.max(bestStreak, effective), lastQualifyingDay,
    isTodayComplete, nextMilestone,
    progressToNextMilestone: nextMilestone ? Math.min(100, Math.round(effective / nextMilestone * 100)) : 100,
    newlyReachedMilestone: STREAK_MILESTONES.find(m => m > currentStreak && m <= effective) ?? null,
    clockAnomaly,
  };
}
export function getMilestoneReward(milestone: StreakMilestone) {
  const multiplier = Math.sqrt(milestone / 3);
  return { realXp: Math.round(50 * multiplier), energy: Math.round(5 * multiplier) };
}
export function getStreakStatusText(state: StreakState) {
  if (state.clockAnomaly) return 'CHECK DEVICE DATE';
  if (!state.currentStreak) return 'NO STREAK';
  return `${state.currentStreak} DAY STREAK` + (state.nextMilestone
    ? ` · NEXT: ${state.nextMilestone} DAYS (${state.progressToNextMilestone}%)` : ' · MAX MILESTONE REACHED');
}
