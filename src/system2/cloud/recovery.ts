import { getCloudState } from './sync';

export interface RecoverySummary {
  available: boolean;
  remoteEvents: number;
  latestEventAt: string | null;
}

export async function inspectCloudRecovery(): Promise<RecoverySummary> {
  const remote = await getCloudState();
  if (!remote) return { available: false, remoteEvents: 0, latestEventAt: null };
  const events = Array.isArray(remote.events) ? remote.events : [];
  const latestEventAt = events.reduce<string | null>((latest, event) => {
    const at = typeof event?.completedAt === 'string' ? event.completedAt : null;
    return at && (!latest || at > latest) ? at : latest;
  }, null);
  return { available: events.length > 0, remoteEvents: events.length, latestEventAt };
}
