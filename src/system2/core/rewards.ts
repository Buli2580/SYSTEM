import type { PlayerProfile, Rank, SkillKey } from './types';
import { SKILL_KEYS } from './progression';
import type { Title } from '../identity/model';
/** a2 contract: floor proportional XP, minimum one for a positive base reward.
 * Existing a1 grants are immutable. Energy is not an XP reward and is unchanged. */
export function scaledQuestXp(xp: number, target: number, baseTarget: number): number {
  if (!Number.isFinite(target) || !Number.isFinite(baseTarget) || target <= 0 || baseTarget <= 0 || !Number.isSafeInteger(xp) || xp < 0) throw new Error('Invalid adaptive XP');
  return xp === 0 ? 0 : Math.max(1, Math.floor(xp * Math.min(target, baseTarget) / baseTarget));
}
export type RewardReceipt = {
  id: string; realXp: number; skillXp: Partial<Record<SkillKey, number>>; energy: number;
  distanceMeters: number; beforeLevel: number; afterLevel: number; beforeRank: Rank; afterRank: Rank;
  skillLevels: { key: SkillKey; before: number; after: number }[];
  newTitles: Title[]; worldUnlocked: boolean;
  bossDamage?: {
    beforeHp:number;
    afterHp:number;
    dealt:number;
    phaseBefore:string;
    phaseAfter:string;
  };
};
export function rewardReceipt(id: string, before: PlayerProfile, after: PlayerProfile, newTitles: Title[] = [], worldUnlocked = false, bossDamage?: RewardReceipt['bossDamage']): RewardReceipt {
  return { id, realXp: after.totalRealXp - before.totalRealXp,
    skillXp: Object.fromEntries(SKILL_KEYS.map(key => [key, after.stats[key].totalXp - before.stats[key].totalXp]).filter(([, xp]) => Number(xp) > 0)),
    energy: after.gameEnergy - before.gameEnergy, distanceMeters: after.totalDistanceMeters - before.totalDistanceMeters,
    beforeLevel: before.realLevel, afterLevel: after.realLevel, beforeRank: before.rank, afterRank: after.rank,
    skillLevels: SKILL_KEYS.filter(key => after.stats[key].level > before.stats[key].level)
      .map(key => ({ key, before: before.stats[key].level, after: after.stats[key].level })), newTitles, worldUnlocked,
    ...(bossDamage ? { bossDamage } : {}) };
}
export function hasLevelUp(receipt: RewardReceipt) { return receipt.afterLevel > receipt.beforeLevel; }
