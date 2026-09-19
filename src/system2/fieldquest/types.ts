import type { RunnableQuest } from '../quests/types';
import type { LocationObject as ExpoLocationObject } from 'expo-location';

export type LocationObject = ExpoLocationObject;

export type FieldQuestVerificationMode =
  | 'MANUAL'
  | 'GPS_DISTANCE'
  | 'TIMER'
  | 'GPS_AND_TIMER'
  | 'ACTIVITY'
  | 'MULTI_REQUIREMENT';

export type FieldQuestStatus =
  | 'READY'
  | 'STARTING'
  | 'ACTIVE'
  | 'PAUSED'
  | 'VERIFYING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'CHECKING'
  | 'ERROR';

export type FieldQuestRequirement = {
  type: FieldQuestVerificationMode;
  minimumDistanceMeters?: number;
  minimumDurationSeconds?: number;
  minimumVerificationScore?: number;
  activityType?: 'WALK' | 'RUN' | 'BIKE';
};

export type FieldQuestProgress = {
  distanceMeters: number;
  durationSeconds: number;
  sampleCount: number;
  currentAccuracy: number | null;
  lastUpdate: number;
};

export type FieldQuestEvidence = {
  sessionId: string;
  questId: string;
  distanceMeters: number;
  durationSeconds: number;
  sampleCount: number;
  verificationScore: number;
  verificationMode: FieldQuestVerificationMode;
  activityEvidence?: import('../activity/types').ActivityEvidence;
  gpsSamples: Array<{
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
  }>;
  reasonCodes: string[];
  verdict: 'VERIFIED' | 'SUSPICIOUS' | 'REJECTED' | 'INSUFFICIENT_DATA';
};

export type FieldQuestResult = {
  success: boolean;
  evidence?: FieldQuestEvidence;
  error?: string;
  reward?: {
    realXp: number;
    skillXp: Record<string, number>;
    energy: number;
  };
};

export type FieldQuestSession = {
  id: string;
  questId: string;
  questTitle: string;
  verificationMode: FieldQuestVerificationMode;
  requirements: FieldQuestRequirement;
  status: FieldQuestStatus;
  progress: FieldQuestProgress;
  evidence?: FieldQuestEvidence;
  startedAt: number;
  pausedAt: number | null;
  completedAt: number | null;
  pausedDuration: number;
  rewardClaimed: boolean;
};

export type GPSQuestTrackerState = {
  startingLocation: LocationObject | null;
  latestLocation: LocationObject | null;
  accumulatedDistance: number;
  elapsedTime: number;
  sampleCount: number;
  accuracy: number | null;
  trackingStatus: 'IDLE' | 'STARTING' | 'TRACKING' | 'PAUSED' | 'ERROR';
  lastError: string | null;
};

export type FieldQuestPermissions = {
  location: 'UNKNOWN' | 'REQUESTING' | 'GRANTED' | 'DENIED' | 'BLOCKED' | 'UNAVAILABLE';
};

export type DeviceReadiness = {
  permissions: FieldQuestPermissions;
  location: 'UNKNOWN' | 'REQUESTING' | 'GRANTED' | 'DENIED' | 'BLOCKED' | 'UNAVAILABLE';
  gpsAvailable: boolean;
  ready: boolean;
  blockingIssues: string[];
};

export type FieldQuestRestoreData = {
  sessionId: string;
  questId: string;
  status: FieldQuestStatus;
  progress: FieldQuestProgress;
  startedAt: number;
  pausedAt: number | null;
  pausedDuration: number;
  evidence?: FieldQuestEvidence;
};