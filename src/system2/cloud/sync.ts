import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  backfillCloudOutbox,
  cloudOutboxStats,
  listPendingCloudOutbox,
  markCloudOutboxAttempt,
  markCloudOutboxSynced,
  ensureCloudUserBinding,
} from '../storage/database';
import { getValidSession } from './auth';
import {reconcileRecentMoveContributions} from './move';
import { CloudRequestError } from './http';
import { processPendingSyncEvents, submitSyncEvent } from './state';

const INSTALL_ID_KEY = 'system.cloud.install.v1';
let installIdPromise: Promise<string> | null = null;

async function createOrLoadInstallId() {
  let id = await AsyncStorage.getItem(INSTALL_ID_KEY);
  if (id) return id;
  id = 'install_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 12);
  await AsyncStorage.setItem(INSTALL_ID_KEY, id);
  return id;
}

function getInstallId() {
  if (!installIdPromise) {
    installIdPromise = createOrLoadInstallId().catch(error => {
      installIdPromise = null;
      throw error;
    });
  }
  return installIdPromise;
}

export type CloudSyncResult = {
  authenticated: boolean;
  sent: number;
  pending: number;
  failed: number;
};

export async function flushCloudOutbox(limit = 25): Promise<CloudSyncResult> {
  const session = await getValidSession();
  if (!session) {
    const stats = await cloudOutboxStats();
    return { authenticated: false, sent: 0, pending: stats.pending, failed: stats.failed };
  }

  await ensureCloudUserBinding(session.user.id);
  await backfillCloudOutbox();
  const installId = await getInstallId();
  const rows = await listPendingCloudOutbox(limit);
  let sent = 0;

  for (const row of rows) {
    try {
      const payload = JSON.parse(row.payload) as Record<string, unknown>;
      await submitSyncEvent({
        eventKey: row.event_key,
        entityType: row.entity_type,
        entityId: row.entity_id,
        payload,
        deviceInstallId: installId,
        clientCreatedAt: row.client_created_at,
        schemaVersion: row.schema_version,
      });
      await markCloudOutboxSynced(row.event_key);
      sent++;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Nieznany błąd synchronizacji.';
      await markCloudOutboxAttempt(row.event_key, message);
      if (
        cause instanceof CloudRequestError &&
        (cause.status === 0 || cause.status === 401 || cause.status === 403 ||
          cause.status === 429 || cause.status >= 500)
      ) break;
    }
  }

  // Uploaded events may still be RECEIVED after a transient server error or
  // out-of-order offline delivery. Retry them even when the local outbox is empty.
  // This changes cloud state only; SQLite remains the offline gameplay source.
  try {
    await processPendingSyncEvents(limit);
  } catch (cause) {
    // Allow the mobile update to run against Online 0.3 during migration rollout.
    if (!(cause instanceof CloudRequestError && cause.code === 'PGRST202')) throw cause;
  }

  // A cloud sync may make older MOVE sessions eligible for Family/School
  // scoring. Reconcile only from PROCESSED server evidence; failure in this
  // optional feature must not invalidate already-synced core gameplay.
  try{
    await reconcileRecentMoveContributions();
  }catch{
    // Group backend can be offline or pending its separate migration.
    // Persisted local MOVE history is retried at the next cloud sync.
  }

  const stats = await cloudOutboxStats();
  return { authenticated: true, sent, pending: stats.pending, failed: stats.failed };
}

export async function getLocalCloudSyncStatus() {
  await backfillCloudOutbox();
  return cloudOutboxStats();
}


export async function ensureCurrentCloudBinding(): Promise<void> {
  const session = await getValidSession();
  if (!session) throw new Error('Najpierw zaloguj SYSTEM CLOUD.');
  await ensureCloudUserBinding(session.user.id);
}
