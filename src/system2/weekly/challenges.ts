export type WeeklyChallengeStatus = 'LOCKED' | 'AVAILABLE' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
export type WeeklyChallenge = {
  id: string; title: string; description: string;
  category: 'QUESTS' | 'ACTIVITY' | 'STREAK' | 'DAILY';
  target: number; progress: number; rewardXp: number; rewardEnergy: number;
  startWeek: string; endWeek: string; status: WeeklyChallengeStatus;
  verificationType: 'VERIFIED_QUESTS' | 'DAILY_COUNT' | 'STREAK_DAYS' | 'ACTIVITY_METERS';
  verificationTarget: number;
};
// Catalog targets/rewards recovered from agent/local a70cb81f. Daily counts distinct days.
export const WEEKLY_CHALLENGE_CATALOG: readonly WeeklyChallenge[] = [
  { id: 'weekly_quest_master', title: 'QUEST MASTER', description: 'Complete 5 verified quests this week', category: 'QUESTS', target: 5, rewardXp: 200, rewardEnergy: 20, verificationType: 'VERIFIED_QUESTS', verificationTarget: 5 },
  { id: 'weekly_daily_consistency', title: 'DAILY CONSISTENCY', description: 'Complete daily quests on 3 different days', category: 'DAILY', target: 3, rewardXp: 150, rewardEnergy: 15, verificationType: 'DAILY_COUNT', verificationTarget: 3 },
  { id: 'weekly_pathfinder', title: 'PATHFINDER', description: 'Travel 10,000 verified meters across activities', category: 'ACTIVITY', target: 10000, rewardXp: 180, rewardEnergy: 18, verificationType: 'ACTIVITY_METERS', verificationTarget: 10000 },
  { id: 'weekly_streak_keeper', title: 'STREAK KEEPER', description: 'Maintain a 7-day streak', category: 'STREAK', target: 7, rewardXp: 250, rewardEnergy: 25, verificationType: 'STREAK_DAYS', verificationTarget: 7 },
].map(c => ({ ...c, progress: 0, startWeek: '', endWeek: '', status: 'AVAILABLE' } as WeeklyChallenge));
export type WeeklyChallengeProgress = {
  challenge: WeeklyChallenge; currentProgress: number; isComplete: boolean;
  percentComplete: number; status: WeeklyChallengeStatus;
};
function assertWeek(week: string) {
  if (!/^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/.test(week)) throw new Error('Invalid ISO week.');
}
export function getActiveWeeklyChallenges(currentWeek: string): WeeklyChallenge[] {
  assertWeek(currentWeek);
  return WEEKLY_CHALLENGE_CATALOG.map(c => ({ ...c, startWeek: currentWeek, endWeek: currentWeek }));
}
export function getWeeklyChallengeStatus(challenge: WeeklyChallenge, currentWeek: string,
  completedData: Record<string, number>): WeeklyChallengeProgress {
  assertWeek(currentWeek); assertWeek(challenge.startWeek); assertWeek(challenge.endWeek);
  const progress = Math.max(0, completedData[challenge.id] ?? 0), isComplete = progress >= challenge.target;
  const status: WeeklyChallengeStatus = currentWeek < challenge.startWeek ? 'LOCKED'
    : currentWeek > challenge.endWeek ? 'EXPIRED' : isComplete ? 'COMPLETED' : progress > 0 ? 'ACTIVE' : 'AVAILABLE';
  return { challenge, currentProgress: progress, isComplete,
    percentComplete: Math.min(100, Math.round(progress / challenge.target * 100)), status };
}
export function buildWeeklyChallengeProgressModel(currentWeek: string, completedData: Record<string, number>) {
  return getActiveWeeklyChallenges(currentWeek).map(c => getWeeklyChallengeStatus(c, currentWeek, completedData));
}
