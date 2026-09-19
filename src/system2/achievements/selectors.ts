// SYSTEM 2.0 - Achievement Evaluation
// Progress evaluation and unlock logic

import type { AchievementDefinition, AchievementProgress } from './types';
import type { PlayerProfile } from '../core/types';
import { ACHIEVEMENTS } from './catalog';

export type ProgressKey = 
  | 'questsCompleted'
  | 'sectorsDiscovered'
  | 'signalsLocated'
  | 'currentStreak'
  | 'realLevel'
  | 'totalRealXp'
  | 'verifiedQuestCount'
  | 'bossesDefeated'
  | 'bossEncounters'
  | 'fieldQuestsDistance'
  | 'fieldQuestsCompleted'
  | 'extraMileCompleted'
  | 'comebackCompleted'
  | 'perfectWeeks'
  | 'earlyBirdCount'
  | 'nightOwlCount'
  | 'allAchievementsUnlocked';

export interface EvaluatedAchievement {
  definition: AchievementDefinition;
  progress: AchievementProgress;
  currentValue: number;
  isComplete: boolean;
}

export function getProgressValue(profile: PlayerProfile, key: ProgressKey): number {
  switch (key) {
    case 'questsCompleted':
      return 0;
    case 'sectorsDiscovered':
      return profile.discoveredSectors;
    case 'signalsLocated':
      return 0;
    case 'currentStreak':
      return profile.streak;
    case 'realLevel':
      return profile.realLevel;
    case 'totalRealXp':
      return profile.totalRealXp;
    case 'verifiedQuestCount':
      return profile.verifiedQuestCount;
    case 'bossesDefeated':
      return 0;
    case 'bossEncounters':
      return 0;
    case 'fieldQuestsDistance':
      return profile.totalDistanceMeters;
    case 'fieldQuestsCompleted':
      return 0;
    case 'extraMileCompleted':
      return 0;
    case 'comebackCompleted':
      return 0;
    case 'perfectWeeks':
      return 0;
    case 'earlyBirdCount':
      return 0;
    case 'nightOwlCount':
      return 0;
    case 'allAchievementsUnlocked':
      return 0;
    default:
      return 0;
  }
}

export function evaluateAchievement(
  achievement: AchievementDefinition,
  profile: PlayerProfile,
  completedQuestIds: readonly string[],
  extraProgress: Record<string, number> = {}
): EvaluatedAchievement {
  const currentValue = getProgressValue(profile, achievement.progressKey as ProgressKey) + 
    (extraProgress[achievement.progressKey] ?? 0);
  
  const prerequisitesMet = checkPrerequisites(achievement, completedQuestIds);
  
  const isComplete = currentValue >= achievement.target && prerequisitesMet;
  const state = determineState(achievement, isComplete, currentValue);

  return {
    definition: achievement,
    progress: {
      achievementId: achievement.id,
      state: state,
      currentProgress: Math.min(currentValue, achievement.target),
      maxProgress: achievement.target,
      unlockedAt: state === 'UNLOCKED' || state === 'CLAIMED' ? new Date().toISOString() : undefined,
      claimedAt: state === 'CLAIMED' ? new Date().toISOString() : undefined,
    },
    currentValue,
    isComplete,
  };
}

function checkPrerequisites(achievement: AchievementDefinition, completedQuestIds: readonly string[]): boolean {
  if (achievement.requiredQuests && achievement.requiredQuests.length > 0) {
    if (!achievement.requiredQuests.every(q => completedQuestIds.includes(q))) {
      return false;
    }
  }
  
  if (achievement.requiredAchievements && achievement.requiredAchievements.length > 0) {
  }
  
  return true;
}

function determineState(
  achievement: AchievementDefinition, 
  isComplete: boolean, 
  currentValue: number
): AchievementProgress['state'] {
  if (isComplete) {
    return 'UNLOCKED';
  }
  if (currentValue > 0) {
    return 'IN_PROGRESS';
  }
  return 'LOCKED';
}

export function evaluateAllAchievements(
  profile: PlayerProfile,
  completedQuestIds: readonly string[],
  extraProgress: Record<string, number> = {}
): EvaluatedAchievement[] {
  return ACHIEVEMENTS.map(achievement => 
    evaluateAchievement(achievement, profile, completedQuestIds, extraProgress)
  );
}

export function getAchievementProgress(
  achievementId: string,
  profile: PlayerProfile,
  completedQuestIds: readonly string[],
  extraProgress: Record<string, number> = {}
): EvaluatedAchievement | null {
  const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
  if (!achievement) return null;
  
  return evaluateAchievement(achievement, profile, completedQuestIds, extraProgress);
}

export function getCategoryProgress(
  category: string,
  profile: PlayerProfile,
  completedQuestIds: readonly string[],
  extraProgress: Record<string, number> = {}
): { completed: number; total: number; percent: number } {
  const categoryAchievements = ACHIEVEMENTS.filter(a => a.category === category);
  const evaluated = categoryAchievements.map(a => 
    evaluateAchievement(a, profile, completedQuestIds, extraProgress)
  );
  
  const completed = evaluated.filter(e => e.progress.state === 'UNLOCKED' || e.progress.state === 'CLAIMED').length;
  const total = evaluated.length;
  
  return {
    completed,
    total,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

export function getAllCategoriesProgress(
  profile: PlayerProfile,
  completedQuestIds: readonly string[],
  extraProgress: Record<string, number> = {}
): Record<string, { completed: number; total: number; percent: number }> {
  const categories = Object.keys(ACHIEVEMENTS.reduce((acc, a) => {
    acc[a.category] = true;
    return acc;
  }, {} as Record<string, boolean>));
  
  const result: Record<string, { completed: number; total: number; percent: number }> = {};
  
  for (const category of categories) {
    result[category] = getCategoryProgress(category, profile, completedQuestIds, extraProgress);
  }
  
  return result;
}

export function getHiddenAchievements(
  unlockedAchievementIds: readonly string[]
): AchievementDefinition[] {
  return ACHIEVEMENTS.filter(a => 
    a.hidden && !a.hideUntilUnlock && !unlockedAchievementIds.includes(a.id)
  );
}

export function getAvailableAchievements(
  unlockedAchievementIds: readonly string[]
): AchievementDefinition[] {
  return ACHIEVEMENTS.filter(a => 
    !a.hidden || unlockedAchievementIds.includes(a.id)
  );
}

export function getAchievementById(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}

export function getAchievementsByCategory(category: string): AchievementDefinition[] {
  return ACHIEVEMENTS.filter(a => a.category === category);
}

export function getTotalAchievementsCount(): number {
  return ACHIEVEMENTS.length;
}

export function getCompletedAchievementsCount(unlockedAchievementIds: readonly string[]): number {
  return unlockedAchievementIds.length;
}

export function getNextAchievements(
  profile: PlayerProfile,
  completedQuestIds: readonly string[],
  extraProgress: Record<string, number> = {},
  limit: number = 5
): AchievementDefinition[] {
  const evaluated = evaluateAllAchievements(profile, completedQuestIds, {});
  
  return evaluated
    .filter(e => e.progress.state === 'IN_PROGRESS' || e.progress.state === 'LOCKED')
    .sort((a, b) => {
      const aProgress = a.currentValue / a.definition.target;
      const bProgress = b.currentValue / b.definition.target;
      if (Math.abs(aProgress - bProgress) > 0.1) {
        return bProgress - aProgress;
      }
      return a.definition.order - b.definition.order;
    })
    .slice(0, limit)
    .map(e => e.definition);
}