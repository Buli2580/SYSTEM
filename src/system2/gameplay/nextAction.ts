import type { DailyState } from '../storage/daily';
import type { RunnableQuest } from '../quests/types';
import type { PlayerProfile } from '../core/types';
import { getQuestStatus, getBlockingPrerequisite } from '../quests/catalog';
import { getActiveWeeklyChallenges } from '../weekly/challenges';
import { getBossById } from '../boss/catalog';
import type { Boss } from '../boss/domain';
import type { BossDetailed } from '../storage/database';

export type NextActionType =
  | 'CONTINUE_ACTIVE_QUEST'
  | 'START_DAILY_QUEST'
  | 'CONTINUE_DAILY_QUEST'
  | 'FINISH_DAILY_OBJECTIVE'
  | 'CONTINUE_WEEKLY_CHALLENGE'
  | 'START_WEEKLY_CHALLENGE'
  | 'PROGRESS_BOSS'
  | 'START_BOSS'
  | 'COMPLETE_AWAKENING'
  | 'UNLOCK_WORLD'
  | 'NONE';

export type NextAction = {
  type: NextActionType;
  label: string;
  description: string;
  questId?: string;
  challengeId?: string;
  bossId?: string;
  priority: number;
};

export function determineNextAction(state: {
  player: PlayerProfile;
  completedQuestIds: readonly string[];
  activeQuestId: string | null;
  daily: DailyState | null;
  awakeningCompleted: boolean;
  worldUnlocked: boolean;
  story: {
    worldLinkComplete: boolean;
    bossComplete: boolean;
    chapters: Array<{ completed: number }>;
  } | null;
  activeBoss: (Boss | BossDetailed) | null;
  weeklyChallenges: Array<{
    id: string;
    status: string;
    progress: number;
  }>;
  getQuest: (id: string) => RunnableQuest | undefined;
}): NextAction {
  const { player, completedQuestIds, activeQuestId, daily, awakeningCompleted, worldUnlocked, story, activeBoss, weeklyChallenges, getQuest } = state;

  // 1. If there's an active quest, continue it
  if (activeQuestId) {
    const quest = getQuest(activeQuestId);
    if (quest) {
      return {
        type: 'CONTINUE_ACTIVE_QUEST',
        label: `CONTINUE ${quest.title}`,
        description: 'Active quest in progress',
        questId: activeQuestId,
        priority: 100,
      };
    }
  }

  // 2. If daily exists and not complete, prioritize daily
  if (daily && !daily.clockAnomaly) {
    const availableDailies = daily.questIds
      .map(id => getQuest(id))
      .filter((q): q is RunnableQuest => q !== undefined && !completedQuestIds.includes(q.id));

    if (availableDailies.length > 0) {
      const activeDaily = availableDailies.find(q => q.id === activeQuestId);
      if (activeDaily) {
        return {
          type: 'CONTINUE_DAILY_QUEST',
          label: `CONTINUE ${activeDaily.title}`,
          description: 'Active daily quest',
          questId: activeDaily.id,
          priority: 90,
        };
      }
      // Return first available daily
      const nextDaily = availableDailies[0];
      return {
        type: 'START_DAILY_QUEST',
        label: `START ${nextDaily.title}`,
        description: `${availableDailies.length} daily quest${availableDailies.length > 1 ? 's' : ''} available`,
        questId: nextDaily.id,
        priority: 85,
      };
    }

    // Daily complete but weekly not
    if (!daily.weeklyClear && daily.weeklyCompleted < 5) {
      return {
        type: 'FINISH_DAILY_OBJECTIVE',
        label: 'DAILY COMPLETE · WEEKLY IN PROGRESS',
        description: `${daily.weeklyCompleted}/5 weekly quests`,
        priority: 80,
      };
    }
  }

  // 3. Weekly challenges
  const activeWeekly = weeklyChallenges.find(c => c.status === 'ACTIVE' || c.status === 'AVAILABLE');
  if (activeWeekly) {
    return {
      type: activeWeekly.status === 'ACTIVE' ? 'CONTINUE_WEEKLY_CHALLENGE' : 'START_WEEKLY_CHALLENGE',
      label: activeWeekly.status === 'ACTIVE' ? 'CONTINUE WEEKLY CHALLENGE' : 'START WEEKLY CHALLENGE',
      description: `Weekly: ${activeWeekly.id}`,
      challengeId: activeWeekly.id,
      priority: 75,
    };
  }

  // 4. Active boss
  if (activeBoss && activeBoss.status === 'ACTIVE') {
    return {
      type: 'PROGRESS_BOSS',
      label: `FIGHT ${activeBoss.name}`,
      description: `${activeBoss.currentHp}/${activeBoss.maxHp} HP`,
      bossId: activeBoss.id,
      priority: 70,
    };
  }

  // 5. Locked boss that can be started
  if (activeBoss && activeBoss.status === 'AVAILABLE') {
    return {
      type: 'START_BOSS',
      label: `START ${activeBoss.name}`,
      description: 'Boss protocol available',
      bossId: activeBoss.id,
      priority: 65,
    };
  }

  // 6. Awakening quests
  if (!awakeningCompleted) {
    const availableAwakening = completedQuestIds.length < 3;
    if (availableAwakening) {
      const nextQuestId = ['first_movement_v1', 'focus_protocol_v1', 'final_trial_v1']
        .find(id => !completedQuestIds.includes(id));
      if (nextQuestId) {
        const quest = getQuest(nextQuestId);
        return {
          type: 'COMPLETE_AWAKENING',
          label: `START ${quest?.title ?? 'AWAKENING QUEST'}`,
          description: `${completedQuestIds.length}/3 Awakening quests complete`,
          questId: nextQuestId,
          priority: 60,
        };
      }
    }
  }

  // 7. World Link
  if (awakeningCompleted && !worldUnlocked && story && !story.worldLinkComplete) {
    return {
      type: 'UNLOCK_WORLD',
      label: 'COMPLETE WORLD LINK',
      description: `${story.chapters[1]?.completed ?? 0}/3 objectives`,
      priority: 55,
    };
  }

  return {
    type: 'NONE',
    label: 'NO ACTIONS AVAILABLE',
    description: 'All objectives complete',
    priority: 0,
  };
}

export function getNextActionLabel(action: NextAction): string {
  return action.label;
}

export function getNextActionDescription(action: NextAction): string {
  return action.description;
}