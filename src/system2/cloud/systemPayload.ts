import type { SystemSnapshot } from '../storage/database';
import type { CloudSave } from '../backend/contracts';

export const SYSTEM_CLOUD_SCHEMA = 1;

export interface SystemCloudPayload {
  snapshot: SystemSnapshot;
}

export function systemCloudSave(
  userId: string,
  deviceId: string,
  snapshot: SystemSnapshot,
  revision = 0,
): CloudSave<SystemCloudPayload> {
  return {
    userId, deviceId, schemaVersion: SYSTEM_CLOUD_SCHEMA, revision,
    updatedAt: new Date().toISOString(), data: { snapshot },
  };
}

export function validateSystemCloudPayload(value: unknown): value is SystemCloudPayload {
  if (!value || typeof value !== 'object') return false;
  const snapshot = (value as SystemCloudPayload).snapshot;
  return Boolean(snapshot && snapshot.player && Array.isArray(snapshot.completedQuestIds)
    && typeof snapshot.onboardingComplete === 'boolean');
}
