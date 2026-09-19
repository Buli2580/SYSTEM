import type { PlayerProfile } from '../core/types';
import { ACHIEVEMENTS, TITLES } from './catalog';
import { evaluateAchievementState } from './engine';
import * as storage from './storage';
import type { AchievementProgress } from './types';

export type ReconcileResult = { newlyUnlocked: string[]; progress: Record<string, AchievementProgress> };

export async function reconcileAchievements(profile: PlayerProfile): Promise<ReconcileResult> {
  const stored = await storage.loadAchievementsState();
  const previous: Record<string, AchievementProgress> = {};
  for (const [id, item] of Object.entries(stored)) previous[id] = { achievementId:id, ...item };
  const evaluated = evaluateAchievementState(profile, previous);

  for (const definition of ACHIEVEMENTS) {
    const item = evaluated.progress[definition.id], old = previous[definition.id];
    if (!old || old.state !== item.state || old.currentProgress !== item.currentProgress || old.maxProgress !== item.maxProgress) {
      await storage.saveAchievementProgress(definition.id, item);
      if (item.state === 'UNLOCKED' && old?.state !== 'UNLOCKED' && old?.state !== 'CLAIMED') {
        await storage.recordAchievementEvent('ACHIEVEMENT_UNLOCKED', definition.id, null, { tier:definition.tier ?? 'COMMON', category:definition.category });
      }
    }
  }

  const titles = await storage.loadTitlesState();
  for (const title of TITLES) {
    if (!title.unlockedByAchievement) continue;
    const achievement = evaluated.progress[title.unlockedByAchievement];
    const unlocked = achievement && (achievement.state === 'UNLOCKED' || achievement.state === 'CLAIMED');
    if (unlocked && !titles.titles[title.id]?.unlocked) {
      await storage.unlockTitle(title.id);
      await storage.recordAchievementEvent('TITLE_UNLOCKED', title.unlockedByAchievement, title.id, { name:title.name });
    }
  }
  return evaluated;
}
