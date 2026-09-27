import type { PlayerProfile } from '../core';
import type { PlayerAchievementState } from '../achievements/types';
import type { DailyState } from '../storage/daily';
import type { StoryState } from '../story/types';
import { AWAKENING_QUESTS, getQuest } from './catalog';

export type NextAction = {
  kind: 'RESUME' | 'AWAKENING' | 'DAILY' | 'STORY' | 'BOSS' | 'ACHIEVEMENTS' | 'PROGRESSION';
  title: string;
  detail: string;
  route: '/quest' | '/quests' | '/story' | '/achievements' | '/character';
  questId?: string;
  priority: number;
};

type NextActionInput = {
  player: PlayerProfile;
  completedQuestIds: readonly string[];
  failedQuestIds?: readonly string[];
  activeQuestId?: string | null;
  awakeningCompleted: boolean;
  daily?: DailyState | null;
  story?: StoryState | null;
  achievements?: PlayerAchievementState | null;
};

export function getNextAction(input: NextActionInput): NextAction {
  const completedQuestIds = input.completedQuestIds ?? [];
  const active = input.activeQuestId ? getQuest(input.activeQuestId) : undefined;
  if (active && !completedQuestIds.includes(active.id)) {
    return { kind: 'RESUME', title: 'CONTINUE MISSION', detail: active.title, route: '/quest', questId: active.id, priority: 100 };
  }

  if (!input.awakeningCompleted) {
    const next = AWAKENING_QUESTS.find(q => !completedQuestIds.includes(q.id));
    if (next) {
      const rematch = input.failedQuestIds?.includes(next.id);
      return {
        kind: 'AWAKENING',
        title: rematch ? 'REMATCH REQUIRED' : 'NEXT AWAKENING QUEST',
        detail: next.title,
        route: '/quest',
        questId: next.id,
        priority: 90,
      };
    }
  }

  if (input.story?.worldLinkComplete && !input.story.bossComplete) {
    return { kind: 'BOSS', title: 'BOSS PROTOCOL', detail: 'THE FIRST WALL', route: '/story', priority: 80 };
  }

  if (input.daily && !input.daily.clockAnomaly && !input.daily.clear) {
    const nextDaily = input.daily.questIds.map(getQuest).find(q => q && !completedQuestIds.includes(q.id));
    if (nextDaily) {
      return {
        kind: 'DAILY',
        title: input.failedQuestIds?.includes(nextDaily.id) ? 'DAILY REMATCH' : 'DAILY PROTOCOL',
        detail: nextDaily.title,
        route: '/quest',
        questId: nextDaily.id,
        priority: 70,
      };
    }
  }

  if (input.story && !input.story.worldLinkComplete) {
    return { kind: 'STORY', title: 'ADVANCE MAIN STORY', detail: 'Open the next WORLD LINK objective', route: '/story', priority: 60 };
  }

  const unclaimed = Object.values(input.achievements?.achievements ?? {}).filter(item => item.unlockedAt && !item.claimedAt).length;
  if (unclaimed > 0) {
    return { kind: 'ACHIEVEMENTS', title: 'CLAIM ACHIEVEMENTS', detail: `${unclaimed} reward${unclaimed === 1 ? '' : 's'} ready`, route: '/achievements', priority: 50 };
  }

  return {
    kind: 'PROGRESSION',
    title: 'BUILD YOUR NEXT LEVEL',
    detail: `REAL LEVEL ${input.player.realLevel} · keep the streak alive`,
    route: '/quests',
    priority: 10,
  };
}
