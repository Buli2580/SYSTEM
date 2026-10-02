import {moveAgeMode} from '../move/age';
import {SAFE_AWAKENING_QUESTS,awakeningStage,awakeningStageCompleted} from './safeAwakening';
import { BOSS_QUESTS, bossQuest } from '../story/catalog';
import { dailyQuest } from '../daily/templates';
import { classifyActivity } from '../activity/classifier';
import { supportsStrength, phoneProvider } from '../activity/capabilities';
import { FIRST_MOVEMENT_QUEST } from './firstMovement';
import { FOCUS_PROTOCOL_QUEST } from './focusProtocol';
import { FINAL_TRIAL_QUEST } from './finalTrial';
import type { RunnableQuest, QuestEvidence, QuestAvailability } from './types';
import { applyAIQuestPresentation } from '../ai/registry';

import { generatedQuest } from '../generation/templates';

export const AWAKENING_CHAPTER_ID = 'awakening_chapter_1';
export const AWAKENING_REWARD_XP = 300;
export const QUESTS: readonly RunnableQuest[] = [FIRST_MOVEMENT_QUEST, FOCUS_PROTOCOL_QUEST, FINAL_TRIAL_QUEST, ...BOSS_QUESTS];
export const AWAKENING_QUESTS = QUESTS.filter(quest => quest.arc === 'AWAKENING' && quest.chapter === 1)
  .sort((a, b) => a.order - b.order);
export function getQuest(id: string, bossDifficulty = 2) {
  const quest = bossQuest(id, bossDifficulty) ?? QUESTS.find(candidate => candidate.id === id) ?? SAFE_AWAKENING_QUESTS.find(candidate=>candidate.id===id) ?? generatedQuest(id) ?? dailyQuest(id);
  return quest ? applyAIQuestPresentation(quest) : undefined;
}

export function prerequisitesCompleted(quest: RunnableQuest, completedIds: readonly string[]) {
  const stage=awakeningStage(quest.id);
  if(stage!==null)return Array.from({length:stage-1},(_,i)=>i+1).every(n=>awakeningStageCompleted(n,completedIds));
  if (quest.category === 'DAILY' || quest.category === 'BOSS') return AWAKENING_QUESTS.every(q => awakeningStageCompleted(q.order,completedIds));
  return QUESTS.filter(other => other.arc === quest.arc && other.chapter === quest.chapter && other.order < quest.order)
    .every(other => completedIds.includes(other.id));
}

export function getQuestStatus(id: string, completedIds: readonly string[], activeQuestId: string | null = null): QuestAvailability {
  const quest = getQuest(id);
  if (!quest || !supportsStrength(quest.verificationStrength ?? 'STANDARD')) return 'LOCKED';
  if (completedIds.includes(id) || awakeningStage(id)!==null && awakeningStageCompleted(awakeningStage(id)!,completedIds)) return 'COMPLETED';
  if (!prerequisitesCompleted(quest, completedIds)) return 'LOCKED';
  return activeQuestId === id ? 'ACTIVE' : 'AVAILABLE';
}

export function getAwakeningProgress(completedIds: readonly string[]) {
  const completed = AWAKENING_QUESTS.filter(quest => awakeningStageCompleted(quest.order,completedIds)).length;
  const total = AWAKENING_QUESTS.length;
  return { completed, total, percent: total ? completed / total * 100 : 0 };
}

export function validateQuestEvidence(evidence: QuestEvidence, bossDifficulty = 2): RunnableQuest {
  const quest = getQuest(evidence.questId, bossDifficulty);
  if (!quest || evidence.verificationType !== quest.verification.type ||
      !Number.isFinite(evidence.durationSeconds) || evidence.durationSeconds <= 0 ||
      !Number.isFinite(evidence.verificationScore) || evidence.verificationScore > 100 ||
      evidence.verificationScore < quest.verification.verificationScoreRequired) {
    throw new Error('Nieprawidłowa weryfikacja misji.');
  }
  if (quest.verification.type !== 'TIMER') {
    if (evidence.verificationType === 'TIMER' || !Number.isFinite(evidence.distanceMeters) ||
        evidence.distanceMeters < quest.verification.minimumDistanceMeters || evidence.distanceMeters < 0) {
      throw new Error('GPS nie potwierdził wymaganego dystansu.');
    }
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

export function awakeningQuestsForPlayer(birthDate?:string|null,now=new Date()){return moveAgeMode(birthDate??undefined,now)==='ADULT'?AWAKENING_QUESTS:SAFE_AWAKENING_QUESTS;}
export function nextAwakeningQuest(birthDate:string|null|undefined,ids:readonly string[]){return awakeningQuestsForPlayer(birthDate).find(q=>!awakeningStageCompleted(q.order,ids));}
