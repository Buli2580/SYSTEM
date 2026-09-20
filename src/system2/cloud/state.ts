import { getValidSession } from './auth';
import { cloudRequest } from './http';

export type CloudSystemState = {
  schemaVersion: number;
  generatedAt: string;
  state: {
    profile: Record<string, unknown> | null;
    player: Record<string, unknown> | null;
    skills: Record<string, unknown>[];
    story: Record<string, unknown>[];
    settings: Record<string, unknown> | null;
    titles: Record<string, unknown>[];
    streak: Record<string, unknown> | null;
    bosses: Record<string, unknown>[];
  };
};

async function requireAccessToken() {
  const session = await getValidSession();
  if (!session) throw new Error('Najpierw zaloguj SYSTEM CLOUD.');
  return session;
}

export async function fetchCloudState(): Promise<CloudSystemState> {
  const session = await requireAccessToken();
  return cloudRequest<CloudSystemState>('/functions/v1/system-state', { method: 'GET' }, session.accessToken);
}

export async function submitSyncEvent(input: {
  eventKey: string;
  entityType: string;
  entityId?: string | null;
  payload?: Record<string, unknown>;
  deviceInstallId?: string | null;
  clientCreatedAt?: string | null;
  schemaVersion?: number;
}): Promise<string> {
  const session = await requireAccessToken();
  return cloudRequest<string>('/rest/v1/rpc/submit_sync_event', {
    method: 'POST',
    body: JSON.stringify({
      p_event_key: input.eventKey,
      p_entity_type: input.entityType,
      p_entity_id: input.entityId ?? null,
      p_payload: input.payload ?? {},
      p_device_install_id: input.deviceInstallId ?? null,
      p_client_created_at: input.clientCreatedAt ?? new Date().toISOString(),
      p_schema_version: input.schemaVersion ?? 1,
    }),
  }, session.accessToken);
}


export type RemoteSyncStatus = {
  total: number;
  received: number;
  processing: number;
  processed: number;
  rejected: number;
  latest_event_at: string | null;
};

export async function getRemoteSyncStatus(): Promise<RemoteSyncStatus> {
  const session = await requireAccessToken();
  const rows = await cloudRequest<RemoteSyncStatus[]>('/rest/v1/rpc/get_sync_status', {
    method: 'POST',
    body: JSON.stringify({}),
  }, session.accessToken);
  return rows[0] ?? { total: 0, received: 0, processing: 0, processed: 0, rejected: 0, latest_event_at: null };
}
