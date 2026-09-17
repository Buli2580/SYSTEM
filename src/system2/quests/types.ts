import type { Quest } from '../core';

export type RunnableQuest = Omit<Quest, 'verification' | 'status'> & {
  order: number;
  secondarySkills: NonNullable<Quest['secondarySkills']>;
  verification:
    | { type: 'GPS_DISTANCE'; minimumDistanceMeters: number; verificationScoreRequired: number }
    | { type: 'TIMER'; minimumDurationSeconds: number; verificationScoreRequired: number }
    | { type: 'MULTI'; minimumDistanceMeters: number; minimumDurationSeconds: number; verificationScoreRequired: number };
};

export type QuestEvidence = { questId: string; verificationScore: number; durationSeconds: number } & (
  | { verificationType: 'GPS_DISTANCE' | 'MULTI'; distanceMeters: number }
  | { verificationType: 'TIMER'; distanceMeters?: never }
);

export type QuestAvailability = 'AVAILABLE' | 'ACTIVE' | 'COMPLETED' | 'LOCKED';
