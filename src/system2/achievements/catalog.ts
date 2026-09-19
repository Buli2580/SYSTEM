import type { PlayerProfile, SkillKey } from '../core/types';

export type AchievementCategory = 'QUESTS' | 'STREAK' | 'LEVEL' | 'SKILL' | 'WORLD' | 'DISTANCE';
export type AchievementTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'MYTHIC';

export type AchievementDefinition = {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  target: number;
  skill?: SkillKey;
  hidden?: boolean;
};

export type AchievementProgress = {
  achievement: AchievementDefinition;
  value: number;
  target: number;
  percent: number;
  unlocked: boolean;
};

const SKILLS: readonly SkillKey[] = ['STR', 'VIT', 'INT', 'WIL', 'CHA', 'CRE', 'RES'];

export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
  { id: 'quest_1', title: 'FIRST CLEAR', description: 'Complete your first verified quest.', category: 'QUESTS', tier: 'BRONZE', target: 1 },
  { id: 'quest_10', title: 'HUNTER', description: 'Complete 10 verified quests.', category: 'QUESTS', tier: 'SILVER', target: 10 },
  { id: 'quest_50', title: 'VETERAN', description: 'Complete 50 verified quests.', category: 'QUESTS', tier: 'GOLD', target: 50 },
  { id: 'streak_3', title: 'MOMENTUM', description: 'Reach a 3-day streak.', category: 'STREAK', tier: 'BRONZE', target: 3 },
  { id: 'streak_7', title: 'UNBROKEN', description: 'Reach a 7-day streak.', category: 'STREAK', tier: 'SILVER', target: 7 },
  { id: 'streak_30', title: 'DISCIPLINE', description: 'Reach a 30-day streak.', category: 'STREAK', tier: 'MYTHIC', target: 30 },
  { id: 'level_5', title: 'AWAKENING II', description: 'Reach real level 5.', category: 'LEVEL', tier: 'BRONZE', target: 5 },
  { id: 'level_10', title: 'DOUBLE DIGITS', description: 'Reach real level 10.', category: 'LEVEL', tier: 'SILVER', target: 10 },
  { id: 'world_5', title: 'PATHFINDER II', description: 'Discover 5 world sectors.', category: 'WORLD', tier: 'SILVER', target: 5 },
  { id: 'distance_10000', title: '10K', description: 'Record 10 km of verified movement.', category: 'DISTANCE', tier: 'BRONZE', target: 10000 },
  { id: 'distance_100000', title: 'CENTURY', description: 'Record 100 km of verified movement.', category: 'DISTANCE', tier: 'GOLD', target: 100000 },
  ...SKILLS.map(skill => ({
    id: 'skill_' + skill.toLowerCase() + '_5',
    title: skill + ' SPECIALIST',
    description: 'Reach level 5 in ' + skill + '.',
    category: 'SKILL' as const,
    tier: 'SILVER' as const,
    target: 5,
    skill,
  })),
];

export function achievementValue(definition: AchievementDefinition, player: PlayerProfile): number {
  switch (definition.category) {
    case 'QUESTS': return player.verifiedQuestCount;
    case 'STREAK': return player.streak;
    case 'LEVEL': return player.realLevel;
    case 'WORLD': return player.discoveredSectors;
    case 'DISTANCE': return player.totalDistanceMeters;
    case 'SKILL': return definition.skill ? player.stats[definition.skill].level : 0;
  }
}

export function getAchievementProgress(player: PlayerProfile): AchievementProgress[] {
  return ACHIEVEMENTS.map(achievement => {
    const value = achievementValue(achievement, player);
    return {
      achievement,
      value,
      target: achievement.target,
      percent: Math.min(100, Math.max(0, Math.round((value / achievement.target) * 100))),
      unlocked: value >= achievement.target,
    };
  });
}

export function unlockedAchievementIds(player: PlayerProfile): string[] {
  return getAchievementProgress(player).filter(item => item.unlocked).map(item => item.achievement.id);
}

export function newlyUnlockedAchievements(before: PlayerProfile, after: PlayerProfile): AchievementDefinition[] {
  const previous = new Set(unlockedAchievementIds(before));
  return getAchievementProgress(after)
    .filter(item => item.unlocked && !previous.has(item.achievement.id))
    .map(item => item.achievement);
}

export function nextAchievements(player: PlayerProfile, limit = 3): AchievementProgress[] {
  return getAchievementProgress(player)
    .filter(item => !item.unlocked && !item.achievement.hidden)
    .sort((a, b) => b.percent - a.percent || a.target - b.target)
    .slice(0, Math.max(0, limit));
}
