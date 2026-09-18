import { getQuest, getQuestStatus } from './catalog';

export type QuestAccess = {
  status: 'LOCKED' | 'AVAILABLE' | 'ACTIVE' | 'COMPLETED' | 'FAILED';
  code: 'UNKNOWN_QUEST' | 'PREREQUISITES' | 'DAILY_UNAVAILABLE' | 'BOSS_LOCKED' | 'COMPLETED' | 'ACTIVE' | 'FAILED_ATTEMPT' | 'AVAILABLE';
  canComplete: boolean;
};
export type AvailabilityContext = {
  completedQuestIds: readonly string[]; activeQuestId?: string | null; failedQuestId?: string | null;
  daily?: { questIds: readonly string[]; clockAnomaly: boolean } | null;
  bossAccessible?: boolean;
};
/** Existing prerequisite/capability rules plus transaction-supplied time/story facts. */
export function questAvailability(id: string, context: AvailabilityContext): QuestAccess {
  const result = (status: QuestAccess['status'], code: QuestAccess['code']): QuestAccess =>
    ({ status, code, canComplete: status === 'AVAILABLE' || status === 'ACTIVE' });
  const quest = getQuest(id);
  if (!quest) return result('LOCKED', 'UNKNOWN_QUEST');
  const base = getQuestStatus(id, context.completedQuestIds, context.activeQuestId);
  if (base === 'COMPLETED') return result('COMPLETED', 'COMPLETED');
  if (base === 'LOCKED') return result('LOCKED', 'PREREQUISITES');
  if (quest.category === 'DAILY' && (!context.daily || context.daily.clockAnomaly || !context.daily.questIds.includes(id))) return result('LOCKED', 'DAILY_UNAVAILABLE');
  if (quest.category === 'BOSS' && !context.bossAccessible) return result('LOCKED', 'BOSS_LOCKED');
  if (base === 'ACTIVE') return result('ACTIVE', 'ACTIVE');
  if (context.failedQuestId === id) return result('FAILED', 'FAILED_ATTEMPT');
  return result('AVAILABLE', 'AVAILABLE');
}
