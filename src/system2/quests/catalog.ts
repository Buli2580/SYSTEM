import { BOSS_QUESTS } from '../story/catalog';
import { dailyQuest } from '../daily/templates';
import { classifyActivity } from '../activity/classifier';
import { supportsStrength, phoneProvider } from '../activity/capabilities';
import { FIRST_MOVEMENT_QUEST } from './firstMovement';
import { FOCUS_PROTOCOL_QUEST } from './focusProtocol';
import { FINAL_TRIAL_QUEST } from './finalTrial';
import { PHOTO_PROOF_QUEST } from './photoProof';
import type { RunnableQuest, QuestEvidence, QuestAvailability } from './types';

export const AWAKENING_CHAPTER_ID = 'awakening_chapter_1';
export const AWAKENING_REWARD_XP = 300;
export const QUESTS: readonly RunnableQuest[] = [FIRST_MOVEMENT_QUEST, FOCUS_PROTOCOL_QUEST, FINAL_TRIAL_QUEST, PHOTO_PROOF_QUEST, ...BOSS_QUESTS];
export const AWAKENING_QUESTS = QUESTS.filter(quest => quest.arc === 'AWAKENING' && quest.chapter === 1)
  .sort((a, b) => a.order - b.order);
export function getQuest(id: string) { return QUESTS.find(quest => quest.id === id) ?? dailyQuest(id); }

export function prerequisitesCompleted(quest: RunnableQuest, completedIds: readonly string[]) {
  if (quest.category === 'DAILY' || quest.category === 'BOSS') return AWAKENING_QUESTS.every(q => completedIds.includes(q.id));
  return QUESTS.filter(other => other.arc === quest.arc && other.chapter === quest.chapter && other.order < quest.order)
    .every(other => completedIds.includes(other.id));
}

export function getQuestStatus(id: string, completedIds: readonly string[], activeQuestId: string | null = null): QuestAvailability {
  const quest = getQuest(id);
  if (!quest || !supportsStrength(quest.verificationStrength ?? 'STANDARD')) return 'LOCKED';
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
  if (quest.proofMode && evidence.photoCaptured !== true) throw new Error('Brak wymaganego dowodu zdjęciowego.');
  if (evidence.photoProofHash !== undefined && !/^[a-f0-9]{64}$/i.test(evidence.photoProofHash)) {
    throw new Error('Nieprawidłowy identyfikator dowodu zdjęciowego.');
  }
  if (quest.verification.type !== 'GPS_DISTANCE' && evidence.durationSeconds < quest.verification.minimumDurationSeconds) {
    throw new Error('Timer nie potwierdził wymaganego czasu.');
  }
  if (quest.verification.type === 'TIMER' && evidence.distanceMeters !== undefined) throw new Error('Nieprawidłowe dane timera.');
  if (!supportsStrength(quest.verificationStrength ?? 'STANDARD')) throw new Error('Wymagane czujniki są niedostępne.');
  if (quest.activityType) {
    const activity = evidence.activity;
    if (!activity || activity.activityTypeExpected !== quest.activityType) throw new Error('Brak potwierdzenia typu aktywności.');
    if ((!phoneProvider.capabilities.steps && activity.sensors.steps !== undefined) || (!phoneProvider.capabilities.motion && activity.sensors.motion !== undefined)) throw new Error('To źródło dowodu nie jest dostępne w tym buildzie.');
    const checked = classifyActivity(quest.activityType, activity.features, activity.sensors);
    if (checked.verdict !== 'VERIFIED' || checked.verificationScore < quest.verification.verificationScoreRequired ||
        evidence.verificationScore !== checked.verificationScore || evidence.distanceMeters !== checked.features.distanceMeters ||
        evidence.durationSeconds !== checked.features.durationSeconds) throw new Error('Aktywność nie została zweryfikowana.');
    evidence.activity = checked;
  }
  return quest;
}
