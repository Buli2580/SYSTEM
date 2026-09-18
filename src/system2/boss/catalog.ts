import { createBoss } from './domain';

export const BOSS_CATALOG = [
  createBoss({
    id: 'inertia',
    name: 'THE INERTIA',
    description: 'Break through inactivity. Complete real quests and daily objectives to deal damage.',
    difficulty: 'TIER_1',
    maxHp: 1000,
    rewardXp: 500,
    rewardEnergy: 50,
    unlockCondition: 'AWAKENING_COMPLETE',
  }),
  createBoss({
    id: 'entropy',
    name: 'ENTROPY',
    description: 'Chaos increases without discipline. Maintain streaks and complete weekly challenges.',
    difficulty: 'TIER_2',
    maxHp: 2500,
    rewardXp: 1200,
    rewardEnergy: 100,
    unlockCondition: 'WORLD_LINK_COMPLETE',
  }),
  createBoss({
    id: 'void',
    name: 'THE VOID',
    description: 'The final test of consistency. Requires mastery across all SYSTEM protocols.',
    difficulty: 'TIER_3',
    maxHp: 5000,
    rewardXp: 3000,
    rewardEnergy: 200,
    unlockCondition: 'DAILY_CLEAR',
  }),
] as const;

export const FIRST_BOSS = BOSS_CATALOG[0];

export function getBossById(id: string) {
  return BOSS_CATALOG.find(b => b.id === id);
}

export function getAvailableBosses(playerState: {
  awakeningCompleted: boolean;
  worldLinkComplete: boolean;
  dailyClear: boolean;
  dailyClockAnomaly: boolean;
}) {
  return BOSS_CATALOG.filter(b => {
    // This would be expanded to check actual stored progress
    return b.status !== 'DEFEATED';
  });
}