import { getLocalCloudSyncStatus } from './sync';

export interface RecoverySummary {
  available: boolean;
  remoteEvents: number;
  latestEventAt: string | null;
}

export async function inspectCloudRecovery(): Promise<RecoverySummary> {
  const status = await getLocalCloudSyncStatus();
  return { available: false, remoteEvents: status.pending, latestEventAt: null };
}
