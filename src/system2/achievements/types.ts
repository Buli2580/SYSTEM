// SYSTEM 2.0 - Achievement Types
// Domain types for the achievement system

import type { SkillKey } from '../core/types';

export type AchievementState =
  | 'LOCKED'
  | 'IN_PROGRESS'
  | 'UNLOCKED'
  | 'CLAIMED';

export type AchievementCategory =
  | 'QUESTS'
  | 'EXPLORATION'
  | 'CONSISTENCY'
  | 'PROGRESSION'
  | 'BOSSES'
  | 'FIELD_ACTIVITY'
  | 'SPECIAL';

export type AchievementReward = {
  realXp: number;
  skillXp?: Partial<Record<SkillKey, number>>;
  gameEnergy?: number;
  titleId?: string;
};

export type AchievementRewardTier =
  | 'COMMON'
  | 'UNCOMMON'
  | 'RARE'
  | 'EPIC'
  | 'LEGENDARY';

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  hidden: boolean;

  // Progress tracking
  target: number;
  progressKey: string; // Key used to track progress in player state

  // Requirements
  requiredQuests?: string[];
  requiredAchievements?: string[];
  requiredLevel?: number;
  requiredStreak?: number;
  requiredXp?: number;
  requiredVerifiedQuests?: number;
  requiredWeeklyChallenges?: number;
  requiredBossesDefeated?: number;
  requiredDistanceMeters?: number;
  requiredSectorsDiscovered?: number;
  requiredXpEarned?: number;

  // Hidden achievements only visible after unlock
  hideUntilUnlock?: boolean;

  // Rewards
  reward: AchievementReward;

  // Metadata
  tier?: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  order: number; // Display order within category
}

export interface AchievementProgress {
  achievementId: string;
  state: 'LOCKED' | 'IN_PROGRESS' | 'UNLOCKED' | 'CLAIMED';
  currentProgress: number;
  maxProgress: number;
  unlockedAt?: string;
  claimedAt?: string;
}

export interface AchievementStateSnapshot {
  achievements: Record<string, AchievementProgress>;
  lastEvaluatedAt: string;
}

export interface TitleDefinition {
  id: string;
  name: string;
  description: string;
  unlockedByAchievement?: string; // Achievement ID that unlocks this title
  isDefault?: boolean;
  order: number;
}

export interface TitleState {
  unlocked: boolean;
  unlockedAt?: string;
  isActive: boolean;
}

export interface PlayerTitleState {
  titles: Record<string, TitleState>;
  activeTitleId: string | null;
}

export interface PlayerAchievementState {
  achievements: Record<string, AchievementProgress>;
  titles: PlayerTitleState;
  lastEvaluatedAt: string;
}

export type AchievementEventType =
  | 'ACHIEVEMENT_UNLOCKED'
  | 'ACHIEVEMENT_CLAIMED'
  | 'TITLE_UNLOCKED'
  | 'TITLE_ACTIVATED';

export interface AchievementEventData {
  type: AchievementEventType;
  achievementId?: string;
  titleId?: string;
  timestamp: number;
}
