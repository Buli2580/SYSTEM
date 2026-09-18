import { weekKey, dayOrdinal } from '../daily/calendar';
import type { RunnableQuest } from '../quests/types';

export type WeeklyChallengeCategory = 'QUESTS' | 'ACTIVITY' | 'STREAK' | 'DAILY';

export type WeeklyChallengeStatus = 'LOCKED' | 'AVAILABLE' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED';

export type WeeklyChallenge = {
  id: string;
  title: string;
  description: string;
  category: WeeklyChallengeCategory;
  target: number;
  progress: number;
  rewardXp: number;
  rewardEnergy: number;
  startWeek: string;
  endWeek: string;
  status: WeeklyChallengeStatus;
  verificationType: 'QUEST_COUNT' | 'DAILY_COUNT' | 'STREAK_DAYS' | 'ACTIVITY_METERS' | 'VERIFIED_QUESTS';
  verificationTarget: number;
};

export type WeeklyChallengeProgress = {
  challenge: WeeklyChallenge;
  currentProgress: number;
  isComplete: boolean;
  percentComplete: number;
  status: WeeklyChallengeStatus;
};

export const WEEKLY_CHALLENGE_CATALOG: readonly WeeklyChallenge[] = [
  {
    id: 'weekly_quest_master',
    title: 'QUEST MASTER',
    description: 'Complete 5 verified quests this week',
    category: 'QUESTS',
    target: 5,
    progress: 0,
    rewardXp: 200,
    rewardEnergy: 20,
    startWeek: '',
    endWeek: '',
    status: 'AVAILABLE',
    verificationType: 'VERIFIED_QUESTS',
    verificationTarget: 5,
  },
  {
    id: 'weekly_daily_consistency',
    title: 'DAILY CONSISTENCY',
    description: 'Complete 3 daily quests on 3 different days',
    category: 'DAILY',
    target: 3,
    progress: 0,
    rewardXp: 150,
    rewardEnergy: 15,
    startWeek: '',
    endWeek: '',
    status: 'AVAILABLE',
    verificationType: 'DAILY_COUNT',
    verificationTarget: 3,
  },
  {
    id: 'weekly_pathfinder',
    title: 'PATHFINDER',
    description: 'Walk 10,000 meters across any activities',
    category: 'ACTIVITY',
    target: 10000,
    progress: 0,
    rewardXp: 180,
    rewardEnergy: 18,
    startWeek: '',
    endWeek: '',
    status: 'AVAILABLE',
    verificationType: 'ACTIVITY_METERS',
    verificationTarget: 10000,
  },
  {
    id: 'weekly_streak_keeper',
    title: 'STREAK KEEPER',
    description: 'Maintain a 7-day streak',
    category: 'STREAK',
    target: 7,
    progress: 0,
    rewardXp: 250,
    rewardEnergy: 25,
    startWeek: '',
    endWeek: '',
    status: 'AVAILABLE',
    verificationType: 'STREAK_DAYS',
    verificationTarget: 7,
  },
] as const;

export function getActiveWeeklyChallenges(currentWeek: string): WeeklyChallenge[] {
  return WEEKLY_CHALLENGE_CATALOG.map(c => ({
    ...c,
    startWeek: currentWeek,
    endWeek: currentWeek,
  }));
}

export function getWeeklyChallengeStatus(
  challenge: WeeklyChallenge,
  currentWeek: string,
  completedData: Record<string, number>
): WeeklyChallengeProgress {
  const isCurrentWeek = challenge.startWeek === currentWeek;
  const isExpired = dayOrdinal(currentWeek.split('-W')[0] + '-01') > dayOrdinal(challenge.endWeek);
  const progress = completedData[challenge.id] ?? 0;
  const percentComplete = Math.min(100, Math.round((progress / challenge.target) * 100));
  const isComplete = progress >= challenge.target;

  let status: WeeklyChallengeStatus;
  if (!isCurrentWeek) status = 'LOCKED';
  else if (isExpired) status = 'EXPIRED';
  else if (isComplete) status = 'COMPLETED';
  else if (progress > 0) status = 'ACTIVE';
  else status = 'AVAILABLE';

  return {
    challenge,
    currentProgress: progress,
    isComplete,
    percentComplete,
    status,
  };
}

export function buildWeeklyChallengeProgressModel(
  currentWeek: string,
  completedData: Record<string, number>
): WeeklyChallengeProgress[] {
  const activeChallenges = getActiveWeeklyChallenges(currentWeek);
  return activeChallenges.map(c => getWeeklyChallengeStatus(c, currentWeek, completedData));
}