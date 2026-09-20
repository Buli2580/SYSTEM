import { getPlayerProgressPercent, xpNeededForRealLevel } from '../core/progression';
import type { PlayerProfile } from '../core/types';
import type { RewardReceipt } from '../core/rewards';

export type ProgressionSnapshot = {
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  totalXp: number;
  progressPercent: number;
  rank: string;
  xpEarned: number;
  leveledUp: boolean;
  previousLevel: number;
  newTitles: string[];
};

export function buildProgressionSnapshot(
  before: PlayerProfile,
  after: PlayerProfile,
  reward?: RewardReceipt
): ProgressionSnapshot {
  const leveledUp = after.realLevel > before.realLevel;
  const xpEarned = reward?.realXp ?? (after.totalRealXp - before.totalRealXp);

  return {
    level: after.realLevel,
    currentXp: after.realXp,
    xpToNextLevel: after.realXpToNextLevel,
    totalXp: after.totalRealXp,
    progressPercent: getPlayerProgressPercent(after) * 100,
    rank: after.rank,
    xpEarned,
    leveledUp,
    previousLevel: before.realLevel,
    newTitles: reward?.newTitles ?? [],
  };
}

export function getXpBreakdown(reward: RewardReceipt): {
  realXp: number;
  skillXp: Record<string, number>;
  energy: number;
  totalSkillXp: number;
} {
  const totalSkillXp = Object.values(reward.skillXp).reduce((a: number, b: number) => a + b, 0);
  return {
    realXp: reward.realXp,
    skillXp: reward.skillXp,
    energy: reward.energy,
    totalSkillXp,
  };
}

export function getLevelUpThreshold(currentLevel: number): number {
  return xpNeededForRealLevel(currentLevel);
}

export function formatXpGain(amount: number): string {
  if (amount >= 1000) {
    return `+${(amount / 1000).toFixed(1)}K XP`;
  }
  return `+${amount} XP`;
}

export function formatEnergyGain(amount: number): string {
  return `+${amount} ENERGY`;
}

export function formatSkillXpGain(skill: string, amount: number): string {
  return `+${amount} ${skill} XP`;
}

export function createFeedbackMessage(
  type: 'QUEST_COMPLETE' | 'DAILY_COMPLETE' | 'WEEKLY_COMPLETE' | 'BOSS_DAMAGE' | 'BOSS_DEFEATED' | 'STREAK_MILESTONE' | 'LEVEL_UP',
  data: Record<string, string | number>
): string {
  switch (type) {
    case 'QUEST_COMPLETE':
      return `QUEST COMPLETE · ${formatXpGain(data.realXp as number)}`;
    case 'DAILY_COMPLETE':
      return `DAILY COMPLETE · ${formatXpGain(data.realXp as number)} · ${formatEnergyGain(data.energy as number)}`;
    case 'WEEKLY_COMPLETE':
      return `WEEKLY CHALLENGE · ${formatXpGain(data.realXp as number)}`;
    case 'BOSS_DAMAGE':
      return `BOSS DAMAGE · ${data.damage} HP`;
    case 'BOSS_DEFEATED':
      return `BOSS DEFEATED · ${formatXpGain(data.realXp as number)}`;
    case 'STREAK_MILESTONE':
      return `${data.milestone} DAY STREAK · ${formatXpGain(data.realXp as number)}`;
    case 'LEVEL_UP':
      return `LEVEL UP · LV.${data.previousLevel} → LV.${data.newLevel}`;
    default:
      return 'UNKNOWN EVENT';
  }
}
