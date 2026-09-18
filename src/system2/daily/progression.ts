import { DAILY_RULES } from './calendar';
import type { RunnableQuest } from '../quests/types';
import type { DailyState } from '../storage/daily';

export type DailyProgressModel = {
  dayKey: string;
  totalQuests: number;
  completedQuests: number;
  remainingQuests: number;
  totalXp: number;
  earnedXp: number;
  xpRemaining: number;
  totalEnergy: number;
  earnedEnergy: number;
  completionPercent: number;
  isComplete: boolean;
  activeQuestId: string | null;
  nextAvailableQuest: RunnableQuest | null;
};

export function buildDailyProgressModel(
  daily: DailyState | null,
  completedQuestIds: readonly string[],
  activeQuestId: string | null,
  getQuest: (id: string) => RunnableQuest | undefined
): DailyProgressModel {
  if (!daily) {
    return {
      dayKey: '',
      totalQuests: 0,
      completedQuests: 0,
      remainingQuests: 0,
      totalXp: 0,
      earnedXp: 0,
      xpRemaining: 0,
      totalEnergy: 0,
      earnedEnergy: 0,
      completionPercent: 0,
      isComplete: false,
      activeQuestId: null,
      nextAvailableQuest: null,
    };
  }

  const availableQuests = daily.questIds
    .map(id => getQuest(id))
    .filter((q): q is RunnableQuest => q !== undefined);

  const completedQuests = availableQuests.filter(q => completedQuestIds.includes(q.id));
  const remainingQuests = availableQuests.filter(q => !completedQuestIds.includes(q.id));

  const totalXp = availableQuests.reduce((sum, q) => sum + q.rewards.realXp, 0);
  const earnedXp = completedQuests.reduce((sum, q) => sum + q.rewards.realXp, 0);
  const xpRemaining = totalXp - earnedXp;

  const totalEnergy = availableQuests.reduce((sum, q) => sum + (q.rewards.gameEnergy ?? 0), 0);
  const earnedEnergy = completedQuests.reduce((sum, q) => sum + (q.rewards.gameEnergy ?? 0), 0);

  const completionPercent = availableQuests.length > 0
    ? Math.round((completedQuests.length / availableQuests.length) * 100)
    : 0;

  const activeQuest = availableQuests.find(q => q.id === activeQuestId) ?? null;
  const nextAvailableQuest = remainingQuests[0] ?? null;

  return {
    dayKey: daily.dayKey,
    totalQuests: availableQuests.length,
    completedQuests: completedQuests.length,
    remainingQuests: remainingQuests.length,
    totalXp,
    earnedXp,
    xpRemaining,
    totalEnergy,
    earnedEnergy,
    completionPercent,
    isComplete: daily.clear,
    activeQuestId: activeQuest?.id ?? null,
    nextAvailableQuest,
  };
}

export function getDailySummaryText(model: DailyProgressModel): string {
  if (model.totalQuests === 0) {
    return 'NO DAILY QUESTS';
  }
  return `${model.completedQuests} / ${model.totalQuests} QUESTS · ${model.earnedXp} / ${model.totalXp} XP · ${model.completionPercent}%`;
}