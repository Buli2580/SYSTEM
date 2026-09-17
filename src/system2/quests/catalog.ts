import { FIRST_MOVEMENT_QUEST } from './firstMovement';
import { FOCUS_PROTOCOL_QUEST } from './focusProtocol';
import { FINAL_TRIAL_QUEST } from './finalTrial';
import type { RunnableQuest, QuestEvidence, QuestAvailability } from './types';

export const AWAKENING_CHAPTER_ID = 'awakening_chapter_1';
export const AWAKENING_REWARD_XP = 300;
export const QUESTS: readonly RunnableQuest[] = [FIRST_MOVEMENT_QUEST, FOCUS_PROTOCOL_QUEST, FINAL_TRIAL_QUEST];
export const AWAKENING_QUESTS = QUESTS.filter(quest => quest.arc === 'AWAKENING' && quest.chapter === 1)
  .sort((a, b) => a.order - b.order);
export function getQuest(id: string) { return QUESTS.find(quest => quest.id === id); }

export function prerequisitesCompleted(quest: RunnableQuest, completedIds: readonly string[]) {
  return QUESTS.filter(other => other.arc === quest.arc && other.chapter === quest.chapter && other.order < quest.order)
    .every(other => completedIds.includes(other.id));
}

export function getQuestStatus(id: string, completedIds: readonly string[], activeQuestId: string | null = null): QuestAvailability {
  const quest = getQuest(id);
  if (!quest) return 'LOCKED';
  if (completedIds.includes(id)) return 'COMPLETED';
  if (!prerequisitesCompleted(quest, completedIds)) return 'LOCKED';
  return activeQuestId === id ? 'ACTIVE' : 'AVAILABLE';
}

export function getAwakeningProgress(completedIds: readonly string[]) {
  const completed = AWAKENING_QUESTS.filter(quest => completedIds.includes(quest.id)).length;
  const total = AWAKENING_QUESTS.length;
  return { completed, total, percent: total ? completed / total * 100 : 0 };
}

export function validateQuestEvidence(evidence: QuestEvidence): RunnableQuest {
  const quest = getQuest(evidence.questId);
  if (!quest || evidence.verificationType !== quest.verification.type ||
      !Number.isFinite(evidence.durationSeconds) || evidence.durationSeconds <= 0 ||
      !Number.isFinite(evidence.verificationScore) || evidence.verificationScore > 100 ||
      evidence.verificationScore < quest.verification.verificationScoreRequired) {
    throw new Error('Nieprawidłowa weryfikacja misji.');
  }
  if (quest.verification.type !== 'TIMER') {
    if (evidence.verificationType === 'TIMER' || !Number.isFinite(evidence.distanceMeters) ||
        evidence.distanceMeters < quest.verification.minimumDistanceMeters) {
      throw new Error('GPS nie potwierdził wymaganego dystansu.');
    }
  }
  if (quest.verification.type !== 'GPS_DISTANCE' && evidence.durationSeconds < quest.verification.minimumDurationSeconds) {
    throw new Error('Timer nie potwierdził wymaganego czasu.');
  }
  if (quest.verification.type === 'TIMER' && evidence.distanceMeters !== undefined) throw new Error('Nieprawidłowe dane timera.');
  return quest;
}
