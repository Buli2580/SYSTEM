import type { PlayerProfile } from '../core/types';
import { telemetry } from '../telemetry/TelemetryProvider';
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
    const item = evaluated.progress[definition.id];
    const old = previous[definition.id];
    if (!old || old.state !== item.state || old.currentProgress !== item.currentProgress || old.maxProgress !== item.maxProgress) {
      await storage.saveAchievementProgress(definition.id, item);
      if (item.state === 'UNLOCKED' && old?.state !== 'UNLOCKED' && old?.state !== 'CLAIMED') {
        await storage.recordAchievementEvent('ACHIEVEMENT_UNLOCKED', definition.id, null, { tier:definition.tier ?? 'COMMON', category:definition.category });
        telemetry.trackEvent('achievement_unlocked', { achievementId:definition.id, category:definition.category, tier:definition.tier ?? 'COMMON' });
      } else {
        telemetry.trackEvent('achievement_progressed', { achievementId:definition.id, progress:item.currentProgress, target:item.maxProgress });
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
      telemetry.trackEvent('title_unlocked', { titleId:title.id, achievementId:title.unlockedByAchievement });
    }
  }
  return evaluated;
}
