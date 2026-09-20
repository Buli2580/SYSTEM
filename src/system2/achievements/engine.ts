import type { PlayerProfile } from '../core/types';
import { ACHIEVEMENTS } from './catalog';
import type { AchievementProgress } from './types';

export type AchievementEvaluation = { progress: Record<string, AchievementProgress>; newlyUnlocked: string[] };

function valueFor(profile: PlayerProfile, key: string, previous: Record<string, AchievementProgress>): number {
  switch (key) {
    case 'verifiedQuestCount':
    case 'questsCompleted': return profile.verifiedQuestCount;
    case 'currentStreak': return profile.streak;
    case 'realLevel': return profile.realLevel;
    case 'totalRealXp': return profile.totalRealXp;
    case 'sectorsDiscovered': return profile.discoveredSectors;
    // Existing catalog targets for fieldQuestsDistance are expressed in kilometres.
    case 'fieldQuestsDistance': return profile.totalDistanceMeters / 1000;
    case 'allAchievementsUnlocked': {
      const required = ACHIEVEMENTS.filter(item => !item.hidden && item.id !== 'completionist');
      return required.every(item => {
        const state = previous[item.id]?.state;
        return state === 'UNLOCKED' || state === 'CLAIMED';
      }) ? 1 : 0;
    }
    default: return 0;
  }
}

export function evaluateAchievementState(
  profile: PlayerProfile,
  previous: Record<string, AchievementProgress> = {},
  now = new Date().toISOString(),
  counters: Record<string, number> = {},
): AchievementEvaluation {
  const progress: Record<string, AchievementProgress> = {};
  const newlyUnlocked: string[] = [];
  const unlocked = new Set(Object.values(previous)
    .filter(item => item.state === 'UNLOCKED' || item.state === 'CLAIMED')
    .map(item => item.achievementId));

  // Catalog dependencies are intentionally resolved to a fixed point so ordering
  // never changes whether an achievement can unlock.
  for (let pass = 0; pass < ACHIEVEMENTS.length; pass++) {
    let changed = false;
    for (const definition of ACHIEVEMENTS) {
      const old = previous[definition.id];
      const current = Math.max(0, Math.min(definition.target, (counters[definition.progressKey] ?? valueFor(profile, definition.progressKey, { ...previous, ...progress }))));
      const prerequisitesMet = (definition.requiredAchievements ?? []).every(id => unlocked.has(id));
      const complete = current >= definition.target && prerequisitesMet;
      const wasUnlocked = old?.state === 'UNLOCKED' || old?.state === 'CLAIMED';
      const state: AchievementProgress['state'] = old?.state === 'CLAIMED'
        ? 'CLAIMED' : wasUnlocked || complete ? 'UNLOCKED' : current > 0 ? 'IN_PROGRESS' : 'LOCKED';
      progress[definition.id] = {
        achievementId: definition.id, state, currentProgress: wasUnlocked ? definition.target : current, maxProgress: definition.target,
        unlockedAt: wasUnlocked ? old?.unlockedAt : complete ? now : undefined, claimedAt: old?.claimedAt,
      };
      if (complete && !unlocked.has(definition.id)) { unlocked.add(definition.id); changed = true; }
    }
    if (!changed) break;
  }

  for (const definition of ACHIEVEMENTS) {
    const old = previous[definition.id];
    const item = progress[definition.id];
    const wasUnlocked = old?.state === 'UNLOCKED' || old?.state === 'CLAIMED';
    if (!wasUnlocked && (item.state === 'UNLOCKED' || item.state === 'CLAIMED')) newlyUnlocked.push(definition.id);
  }
  return { progress, newlyUnlocked };
}

export function achievementPercent(item: AchievementProgress): number {
  return item.maxProgress <= 0 ? 0 : Math.min(100, Math.max(0, Math.round(item.currentProgress / item.maxProgress * 100)));
}

export function nextAchievementIds(profile: PlayerProfile, previous: Record<string, AchievementProgress> = {}, limit = 3): string[] {
  const { progress } = evaluateAchievementState(profile, previous);
  return ACHIEVEMENTS.filter(def => progress[def.id].state !== 'UNLOCKED' && progress[def.id].state !== 'CLAIMED' && !def.hidden)
    .sort((a,b) => achievementPercent(progress[b.id]) - achievementPercent(progress[a.id]) || a.order-b.order)
    .slice(0, Math.max(0, limit)).map(def => def.id);
}
