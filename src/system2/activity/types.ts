export type ActivityType = 'WALK' | 'RUN' | 'BIKE' | 'VEHICLE' | 'STATIONARY' | 'UNKNOWN';
export type Verdict = 'VERIFIED' | 'SUSPICIOUS' | 'REJECTED';
export type VerificationStrength = 'STANDARD' | 'ENHANCED' | 'STRICT';
export type QuestDifficultyProfile = 'EASY' | 'NORMAL' | 'HARD';
export type FutureProof = 'PHOTO' | 'WATCH' | 'HEALTH' | 'TRAINER_APPROVAL' | 'QR' | 'PARTY' | 'LOCATION' | 'MUTUAL_CONFIRMATION';
export type FutureSession = 'WORKOUT_SESSION';
export type ReasonCode = 'GPS_POOR_ACCURACY' | 'GPS_TELEPORT' | 'IMPOSSIBLE_SPEED' | 'SPEED_PATTERN_MISMATCH' | 'NO_STEP_PATTERN' | 'STEP_RATE_MISMATCH' | 'ACTIVITY_TYPE_MISMATCH' | 'MOCK_LOCATION' | 'SENSOR_DATA_INSUFFICIENT' | 'UNREALISTIC_ACCELERATION' | 'TOO_MANY_GPS_GAPS';
export type SensorSummary = { steps?: number; cadence?: number; motion?: 'PERIODIC' | 'STILL' | 'MOVING' };
export type ActivityFeatures = {
 distanceMeters: number; durationSeconds: number; averageSpeedMps: number; medianSpeedMps: number;
 maxSpeedMps: number; speedVariance: number; accelerationChanges: number; stops: number;
 movingSeconds: number; stationarySeconds: number; gpsGaps: number; rejectedSamples: number;
 teleportCount: number; sampleCount: number; meanAccuracy: number; maxAccuracy: number; mocked: boolean;
};
export type ActivityEvidence = {
 activityTypeExpected: ActivityType; activityTypeDetected: ActivityType; verdict: Verdict;
 verificationScore: number; reasonCodes: ReasonCode[]; features: ActivityFeatures;
 sensors: SensorSummary; sensorSources: ('GPS' | 'STEPS' | 'MOTION')[];
 additionalProofRequired: boolean;
};
export type ExternalActivityEvidenceProvider = {
 source: 'PHONE' | 'WATCH' | 'HEALTH_CONNECT' | 'APPLE_HEALTH';
 capabilities: { gps: boolean; steps: boolean; motion: boolean; watch: boolean };
 // A future native adapter must scope evidence to this session, never import historic XP.
 start: () => Promise<{ summary: () => SensorSummary; remove: () => void }>;
};
