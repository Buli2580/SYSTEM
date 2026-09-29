import type { BackgroundQuestSession, CloudOutboxFailure } from '../storage/database';
import type { RemoteSyncStatus } from '../cloud/state';

export type TesterReportInput = {
  generatedAt: string;
  appVersion: string;
  versionCode: number | null;
  platform: string;
  osVersion: string | number;
  ready: boolean;
  activeQuestId: string | null;
  systemError: string | null;
  notificationError: string | null;
  foregroundPermission: string;
  backgroundPermission: string;
  locationServicesEnabled: boolean;
  backgroundLocationAvailable: boolean;
  nativeBackgroundTaskStarted: boolean;
  database: { schema?: number; integrity?: string; events?: number };
  backgroundSession: BackgroundQuestSession | null;
  cloudAuthenticated: boolean;
  cloudBound: boolean;
  outbox: { pending: number; synced: number; failed: number };
  remoteSync: RemoteSyncStatus | null;
  latestSyncFailure: CloudOutboxFailure | null;
};

export function buildTesterReport(input: TesterReportInput) {
  return {
    report_schema: 1,
    generated_at: input.generatedAt,
    app: {
      version: input.appVersion,
      version_code: input.versionCode,
      platform: input.platform,
      os_version: input.osVersion,
    },
    runtime: {
      ready: input.ready,
      active_quest_id: input.activeQuestId,
      system_error: input.systemError,
      notification_error: input.notificationError,
    },
    permissions: {
      foreground_location: input.foregroundPermission,
      background_location: input.backgroundPermission,
      location_services_enabled: input.locationServicesEnabled,
      background_location_available: input.backgroundLocationAvailable,
    },
    storage: {
      schema: input.database.schema ?? null,
      integrity: input.database.integrity ?? null,
      verified_events: input.database.events ?? 0,
    },
    background_tracking: {
      native_task_started: input.nativeBackgroundTaskStarted,
      session: input.backgroundSession ? {
        quest_id: input.backgroundSession.questId,
        mode: input.backgroundSession.mode,
        extended_goal: input.backgroundSession.extendedGoal,
        updated_at: input.backgroundSession.updatedAt,
        last_observed_timestamp: input.backgroundSession.lastObservedTimestamp ?? null,
        has_location_anchor: Boolean(input.backgroundSession.lastPoint),
      } : null,
    },
    cloud: {
      authenticated: input.cloudAuthenticated,
      local_profile_bound: input.cloudBound,
      outbox: input.outbox,
      remote_sync: input.remoteSync,
      latest_failure: input.latestSyncFailure ? {
        event_key: input.latestSyncFailure.eventKey,
        attempts: input.latestSyncFailure.attempts,
        last_attempt_at: input.latestSyncFailure.lastAttemptAt,
        last_error: input.latestSyncFailure.lastError,
      } : null,
    },
    privacy: {
      raw_gps_coordinates_included: false,
      auth_tokens_included: false,
      email_included: false,
      user_uuid_included: false,
    },
  };
}
