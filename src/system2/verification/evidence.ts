import type { QuestEvidence, RunnableQuest } from '../quests/types';

// Both conditions are required for MULTI, regardless of which finishes first.
export function buildEvidence(quest: RunnableQuest, distance: number, seconds: number, score: number): QuestEvidence | null {
  const rule = quest.verification;
  if (rule.type !== 'TIMER' && (distance < rule.minimumDistanceMeters || score < rule.verificationScoreRequired)) return null;
  if (rule.type !== 'GPS_DISTANCE' && seconds < rule.minimumDurationSeconds) return null;
  return rule.type === 'TIMER'
    ? { questId: quest.id, verificationType: 'TIMER', durationSeconds: seconds, verificationScore: 100 }
    : { questId: quest.id, verificationType: rule.type, durationSeconds: seconds, verificationScore: score, distanceMeters: distance };
}
