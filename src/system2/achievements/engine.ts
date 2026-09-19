import type { PlayerProfile } from '../core/types';
import { ACHIEVEMENTS } from './catalog';
import type { AchievementProgress } from './types';

export type AchievementEvaluation = {
  progress: Record<string, AchievementProgress>;
  newlyUnlocked: string[];
};

function valueFor(profile: PlayerProfile, key: string): number {
  switch (key) {
    case 'verifiedQuestCount':
    case 'questsCompleted': return profile.verifiedQuestCount;
    case 'currentStreak': return profile.streak;
    case 'realLevel': return profile.realLevel;
    case 'totalRealXp': return profile.totalRealXp;
    case 'sectorsDiscovered': return profile.discoveredSectors;
    case 'fieldQuestsDistance': return profile.totalDistanceMeters;
    default: return 0;
  }
}

export function evaluateAchievementState(
  profile: PlayerProfile,
  previous: Record<string, AchievementProgress> = {},
  now = new Date().toISOString(),
): AchievementEvaluation {
  const progress: Record<string, AchievementProgress> = {};
  const newlyUnlocked: string[] = [];
  for (const definition of ACHIEVEMENTS) {
    const old = previous[definition.id];
    const current = Math.max(0, Math.min(definition.target, valueFor(profile, definition.progressKey)));
    const complete = current >= definition.target;
    const wasUnlocked = old?.state === 'UNLOCKED' || old?.state === 'CLAIMED';
    const state: AchievementProgress['state'] = old?.state === 'CLAIMED'
      ? 'CLAIMED'
      : complete ? 'UNLOCKED' : current > 0 ? 'IN_PROGRESS' : 'LOCKED';
    if (complete && !wasUnlocked) newlyUnlocked.push(definition.id);
    progress[definition.id] = {
      achievementId: definition.id,
      state,
      currentProgress: current,
      maxProgress: definition.target,
      unlockedAt: wasUnlocked ? old?.unlockedAt : complete ? now : undefined,
      claimedAt: old?.claimedAt,
    };
  }
  return { progress, newlyUnlocked };
}

export function achievementPercent(item: AchievementProgress): number {
  if (item.maxProgress <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round(item.currentProgress / item.maxProgress * 100)));
}

export function nextAchievementIds(profile: PlayerProfile, previous: Record<string, AchievementProgress> = {}, limit = 3): string[] {
  const { progress } = evaluateAchievementState(profile, previous);
  return ACHIEVEMENTS
    .filter(def => progress[def.id].state !== 'UNLOCKED' && progress[def.id].state !== 'CLAIMED' && !def.hidden)
    .sort((a,b) => achievementPercent(progress[b.id]) - achievementPercent(progress[a.id]) || a.order-b.order)
    .slice(0, Math.max(0, limit))
    .map(def => def.id);
}
