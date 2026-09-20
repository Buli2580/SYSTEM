import { parseEvent } from '../identity/history';
import { getQuest } from '../quests/catalog';
import type { PlayerProfile } from '../core/types';
import { ACHIEVEMENTS, TITLES } from './catalog';
import { evaluateAchievementState } from './engine';
import { achievementTransaction, achievementStorage as storage } from './storage';
import type { AchievementProgress } from './types';

export type ReconcileResult = { newlyUnlocked: string[]; progress: Record<string, AchievementProgress> };

export async function reconcileAchievements(profile: PlayerProfile): Promise<ReconcileResult> {
  return achievementTransaction(async txn => {
    const current = await txn.getFirstAsync<{ value: string }>('SELECT value FROM app_state WHERE key = ?', 'player');
    if (!current || JSON.parse(current.value).id !== profile.id) return { newlyUnlocked: [], progress: {} };
    const stored = await storage.loadAchievementsState(txn);
    const previous: Record<string, AchievementProgress> = {};
    for (const [id, item] of Object.entries(stored)) previous[id] = { achievementId:id, ...item };
    const count = async (sql: string) => (await txn.getFirstAsync<{ n: number }>(sql))?.n ?? 0;
    const completions = await txn.getAllAsync<{ quest_id: string; completed_at: string }>('SELECT quest_id, completed_at FROM quest_completions');
    const counters: Record<string, number> = {
      signalsLocated: await count("SELECT COUNT(*) n FROM world_signals WHERE status = 'LOCATED'"),
      bossesDefeated: await count("SELECT COUNT(*) n FROM story_events WHERE type = 'BOSS_DEFEATED'"),
      bossEncounters: await count('SELECT COUNT(*) n FROM boss_progress'),
      extraMileCompleted: await count("SELECT COUNT(*) n FROM story_progress WHERE id = 'extra_mile_v1'"),
      comebackCompleted: await count("SELECT COUNT(*) n FROM story_progress WHERE id = 'no_turning_back_v1'"),
      perfectWeeks: await count('SELECT COUNT(*) n FROM protocol_bonuses WHERE streak >= 7'),
      fieldQuestsCompleted: 0, earlyBirdCount: 0, nightOwlCount: 0,
      longestWalkQuestKm: 0, longestRunQuestKm: 0, runQuestsDistance: 0,
    };
    for (const completion of completions) {
      const quest = getQuest(completion.quest_id);
      if (quest?.verification.type === 'GPS_DISTANCE' || quest?.verification.type === 'MULTI') counters.fieldQuestsCompleted++;
      if (quest?.category === 'DAILY') {
        const hour = new Date(completion.completed_at).getHours();
        if (hour < 8) counters.earlyBirdCount++;
        if (hour >= 22) counters.nightOwlCount++;
      }
    }
    const events = await txn.getAllAsync<{ payload: string }>('SELECT payload FROM verified_events');
    const completedIds = new Set(completions.map(item => item.quest_id));
    for (const row of events) {
      const event = parseEvent(row.payload);
      const quest = getQuest(event.questId);
      if (!event.verified || !completedIds.has(event.questId) || !quest || !['GPS_DISTANCE', 'MULTI'].includes(quest.verification.type)) continue;
      const km = (event.distanceMeters ?? 0) / 1000;
      if (!Number.isFinite(km) || km < 0) continue;
      // Awakening's legacy GPS quests predate activityType and explicitly require walking.
      if (quest.activityType === 'WALK' || (!quest.activityType && quest.arc === 'AWAKENING')) {
        counters.longestWalkQuestKm = Math.max(counters.longestWalkQuestKm, km);
      }
      if (quest.activityType === 'RUN') {
        counters.longestRunQuestKm = Math.max(counters.longestRunQuestKm, km);
        counters.runQuestsDistance += km;
      }
    }
    const evaluated = evaluateAchievementState(profile, previous, new Date().toISOString(), counters);

    for (const definition of ACHIEVEMENTS) {
      const item = evaluated.progress[definition.id], old = previous[definition.id];
      if (!old || old.state !== item.state || old.currentProgress !== item.currentProgress || old.maxProgress !== item.maxProgress) {
        await storage.saveAchievementProgress(txn, definition.id, item);
        if (item.state === 'UNLOCKED' && old?.state !== 'UNLOCKED' && old?.state !== 'CLAIMED') {
          await storage.recordAchievementEvent(txn, 'ACHIEVEMENT_UNLOCKED', definition.id, null, { tier:definition.tier ?? 'COMMON', category:definition.category });
        }
      }
    }

    const titles = await storage.loadTitlesState(txn);
    for (const title of TITLES) {
      if (!title.unlockedByAchievement) continue;
      const achievement = evaluated.progress[title.unlockedByAchievement];
      const unlocked = achievement && (achievement.state === 'UNLOCKED' || achievement.state === 'CLAIMED');
      if (unlocked && !titles.titles[title.id]?.unlocked) {
        await storage.unlockTitle(txn, title.id);
        await storage.recordAchievementEvent(txn, 'TITLE_UNLOCKED', title.unlockedByAchievement, title.id, { name:title.name });
      }
    }
    return evaluated;
  });
}
