import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  backfillCloudOutbox,
  cloudOutboxStats,
  listPendingCloudOutbox,
  markCloudOutboxAttempt,
  markCloudOutboxSynced,
} from '../storage/database';
import { getValidSession } from './auth';
import { CloudRequestError } from './http';
import { submitSyncEvent } from './state';

const INSTALL_ID_KEY = 'system.cloud.install.v1';

async function getInstallId() {
  let id = await AsyncStorage.getItem(INSTALL_ID_KEY);
  if (id) return id;
  id = 'install_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 12);
  await AsyncStorage.setItem(INSTALL_ID_KEY, id);
  return id;
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
      if (cause instanceof CloudRequestError && (cause.status === 401 || cause.status === 403)) break;
    }
  }

  const stats = await cloudOutboxStats();
  return { authenticated: true, sent, pending: stats.pending, failed: stats.failed };
}

export async function getLocalCloudSyncStatus() {
  await backfillCloudOutbox();
  return cloudOutboxStats();
}
