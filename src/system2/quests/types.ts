import type { Quest } from '../core';

export type RunnableQuest = Omit<Quest, 'verification' | 'status'> & {
  adaptiveDifficulty?: number;
  order: number;
  templateId?: string; dayKey?: string;
  activityType?: import('../activity/types').ActivityType;
  verificationStrength?: import('../activity/types').VerificationStrength;
  secondarySkills: NonNullable<Quest['secondarySkills']>;
  verification:
    | { type: 'GPS_DISTANCE'; minimumDistanceMeters: number; verificationScoreRequired: number }
    | { type: 'TIMER'; minimumDurationSeconds: number; verificationScoreRequired: number }
    | { type: 'MULTI'; minimumDistanceMeters: number; minimumDurationSeconds: number; verificationScoreRequired: number };
};

export type QuestEvidence = { questId: string; attemptId?: string; activity?: import('../activity/types').ActivityEvidence; verificationScore: number; durationSeconds: number } & (
  | { verificationType: 'GPS_DISTANCE' | 'MULTI'; distanceMeters: number }
  | { verificationType: 'TIMER'; distanceMeters?: never }
);

export type QuestAvailability = 'AVAILABLE' | 'ACTIVE' | 'COMPLETED' | 'LOCKED';
