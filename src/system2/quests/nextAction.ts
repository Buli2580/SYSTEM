import { directSystem } from '../director/engine';
import type { SystemSnapshot } from '../storage/database';
import type { PlayerProfile } from '../core';
import type { PlayerAchievementState } from '../achievements/types';
import type { DailyState } from '../storage/daily';
import type { StoryState } from '../story/types';
import { nextAwakeningQuest, getQuest } from './catalog';

export type NextAction = {
  kind: 'RESUME' | 'AWAKENING' | 'DAILY' | 'STORY' | 'BOSS' | 'WORLD_EVENT' | 'ACHIEVEMENTS' | 'PROGRESSION' | 'GOAL' | 'JOURNEY';
  title: string;
  detail: string;
  route: '/quest' | '/quests' | '/story' | '/world' | '/achievements' | '/character' | '/goals';
  questId?: string;
  priority: number;
};

type NextActionInput = Partial<Pick<SystemSnapshot, 'goals' | 'journeys' | 'journeyQuestIds' | 'recentActivity'>> & {
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
  const active = input.activeQuestId ? getQuest(input.activeQuestId) : undefined;
  if (active && !input.completedQuestIds.includes(active.id)) {
    return { kind: 'RESUME', title: 'CONTINUE MISSION', detail: active.title, route: '/quest', questId: active.id, priority: 100 };
  }

  if (!input.awakeningCompleted) {
    const next = nextAwakeningQuest(input.player.birthDate,input.completedQuestIds);
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

  if (input.goals) {
    const directive = directSystem({ ...input, completedQuestIds: [...input.completedQuestIds], daily: input.daily ?? null, story: input.story ?? null,
      goals: input.goals, journeys: input.journeys ?? [], journeyQuestIds: input.journeyQuestIds ?? {}, recentActivity: input.recentActivity ?? [] }, input.activeQuestId ?? null);
    if (directive.kind !== 'REST') {
      if (directive.route === '/quest' && !directive.questId) {
        return {
          kind: 'PROGRESSION',
          title: 'REFRESH QUEST PROTOCOL',
          detail: 'SYSTEM wykrył niepełną dyrektywę misji. Otwórz Quest Hub, aby odświeżyć stan.',
          route: '/quests',
          priority: 85,
        };
      }
      return { kind: directive.kind === 'WORLD_EVENT' ? 'WORLD_EVENT' : directive.route === '/goals' ? 'GOAL' : directive.journeyId ? 'JOURNEY' : directive.kind === 'CHALLENGE_BOSS' ? 'BOSS' : 'DAILY',
        title: directive.title, detail: directive.reason, route: directive.route, questId: directive.questId, priority: directive.kind === 'WORLD_EVENT' ? 88 : 85 };
    }
  }

  if (input.story?.worldLinkComplete && !input.story.bossComplete) {
    return { kind: 'BOSS', title: 'BOSS PROTOCOL', detail: 'THE FIRST WALL', route: '/story', priority: 80 };
  }

  if (input.daily && !input.daily.clockAnomaly && !input.daily.clear) {
    const nextDaily = input.daily.questIds.map(id => getQuest(id)).find(q => q && !input.completedQuestIds.includes(q.id));
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

  // Achievements unlock automatically. Until a durable "seen" state exists,
  // they must not become a sticky command-deck action that the player cannot clear.

  return {
    kind: 'PROGRESSION',
    title: 'BUILD YOUR NEXT LEVEL',
    detail: `REAL LEVEL ${input.player.realLevel} · keep the streak alive`,
    route: '/quests',
    priority: 10,
  };
}
