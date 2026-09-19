import type { FieldQuestEvidence, FieldQuestVerificationMode } from './types';
import type { ActivityEvidence, ActivityFeatures, ActivityType, Verdict, ReasonCode } from '../activity/types';
import { classifyActivity, verdictMessage } from '../activity/classifier';
import { distanceBetween, isUsableLocation, verifiedSegment, verificationScoreForAccuracy } from '../verification/gps';

export type VerificationResult =
  | { verdict: 'VERIFIED'; score: number; evidence: FieldQuestEvidence }
  | { verdict: 'SUSPICIOUS'; score: number; reasonCodes: ReasonCode[]; evidence: FieldQuestEvidence }
  | { verdict: 'REJECTED'; score: number; reasonCodes: ReasonCode[]; evidence: FieldQuestEvidence }
  | { verdict: 'INSUFFICIENT_DATA'; score: number; reasonCodes: ReasonCode[]; evidence: FieldQuestEvidence };

export function verifyFieldQuest(
  evidence: FieldQuestEvidence,
  requirements: {
    minimumDistanceMeters?: number;
    minimumDurationSeconds?: number;
    minimumVerificationScore?: number;
    activityType?: ActivityType;
  }
): VerificationResult {
  const reasonCodes: ReasonCode[] = [];
  let verdict: Verdict = 'VERIFIED';
  let score = evidence.verificationScore;

  if (requirements.minimumDistanceMeters !== undefined) {
    if (evidence.distanceMeters < requirements.minimumDistanceMeters) {
      reasonCodes.push('SENSOR_DATA_INSUFFICIENT');
      verdict = 'REJECTED';
    }
  }

  if (requirements.minimumDurationSeconds !== undefined) {
    if (evidence.durationSeconds < requirements.minimumDurationSeconds) {
      reasonCodes.push('SENSOR_DATA_INSUFFICIENT');
      verdict = 'REJECTED';
    }
  }

  if (requirements.minimumVerificationScore !== undefined) {
    if (evidence.verificationScore < requirements.minimumVerificationScore) {
      reasonCodes.push('SENSOR_DATA_INSUFFICIENT');
      verdict = verdict === 'VERIFIED' ? 'SUSPICIOUS' : 'REJECTED';
    }
  }

  if (evidence.sampleCount < 8 || evidence.durationSeconds < 30) {
    reasonCodes.push('SENSOR_DATA_INSUFFICIENT');
    if (verdict === 'VERIFIED') verdict = 'SUSPICIOUS';
  }

  if (evidence.gpsSamples.length > 0) {
    const meanAccuracy = evidence.gpsSamples.reduce((a, b) => a + b.accuracy, 0) / evidence.gpsSamples.length;
    if (meanAccuracy > 30) {
      reasonCodes.push('GPS_POOR_ACCURACY');
      if (verdict === 'VERIFIED') verdict = 'SUSPICIOUS';
    }

    let teleportCount = 0;
    for (let i = 1; i < evidence.gpsSamples.length; i++) {
      const prev = evidence.gpsSamples[i - 1];
      const curr = evidence.gpsSamples[i];
      const dist = distanceBetween(
        { coords: { latitude: prev.latitude, longitude: prev.longitude, accuracy: prev.accuracy, altitude: null, altitudeAccuracy: null, heading: null, speed: null }, timestamp: prev.timestamp },
        { coords: { latitude: curr.latitude, longitude: curr.longitude, accuracy: curr.accuracy, altitude: null, altitudeAccuracy: null, heading: null, speed: null }, timestamp: curr.timestamp }
      );
      const timeDiff = evidence.gpsSamples[i].timestamp - evidence.gpsSamples[i - 1].timestamp;
      if (dist > 100 && timeDiff < 5000) teleportCount++;
    }
    if (teleportCount > 2) {
      reasonCodes.push('GPS_TELEPORT');
      verdict = 'REJECTED';
    }
  }

  if (evidence.activityEvidence) {
    const activity = evidence.activityEvidence;
    if (requirements.activityType && activity.activityTypeDetected !== requirements.activityType) {
      reasonCodes.push('ACTIVITY_TYPE_MISMATCH');
      if (verdict === 'VERIFIED') verdict = 'SUSPICIOUS';
    }

    if (activity.activityTypeExpected === 'RUN' && activity.sensors.steps !== undefined && activity.sensors.steps === 0) {
      reasonCodes.push('NO_STEP_PATTERN');
      verdict = 'REJECTED';
    }

    if (activity.sensors.motion === 'STILL' && activity.features.distanceMeters > 100) {
      reasonCodes.push('SPEED_PATTERN_MISMATCH');
      verdict = 'REJECTED';
    }
  }

  if (verdict === 'VERIFIED' && score < 70) {
    verdict = 'SUSPICIOUS';
    reasonCodes.push('SENSOR_DATA_INSUFFICIENT');
  }

  const uniqueReasonCodes = [...new Set(reasonCodes)];

  const resultEvidence: FieldQuestEvidence = {
    ...evidence,
    reasonCodes: uniqueReasonCodes,
    verdict,
  };

  if (verdict === 'VERIFIED') {
    return { verdict: 'VERIFIED', score, evidence: resultEvidence };
  }
  if (verdict === 'SUSPICIOUS') {
    return { verdict: 'SUSPICIOUS', score, reasonCodes: uniqueReasonCodes, evidence: resultEvidence };
  }
  if (verdict === 'REJECTED') {
    return { verdict: 'REJECTED', score, reasonCodes: uniqueReasonCodes, evidence: resultEvidence };
  }
  return { verdict: 'INSUFFICIENT_DATA', score, reasonCodes: uniqueReasonCodes, evidence: resultEvidence };
}

export function buildFieldQuestEvidence(
  questId: string,
  sessionId: string,
  distanceMeters: number,
  durationSeconds: number,
  sampleCount: number,
  verificationScore: number,
  verificationMode: FieldQuestVerificationMode,
  gpsSamples: Array<{ latitude: number; longitude: number; accuracy: number; timestamp: number }>,
  activityEvidence?: ActivityEvidence
): FieldQuestEvidence {
  return {
    sessionId,
    questId,
    distanceMeters,
    durationSeconds,
    sampleCount,
    verificationScore,
    verificationMode,
    activityEvidence,
    gpsSamples,
    reasonCodes: [],
    verdict: 'VERIFIED',
  };
}