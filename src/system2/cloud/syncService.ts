import type { CloudRepository, CloudSave } from '../backend/contracts';
import { resolveCloudSave } from '../backend/sync';

export interface LocalCloudState<T> {
  read(): Promise<CloudSave<T>>;
  applyRemote(save: CloudSave<T>): Promise<void>;
  markSynced(save: CloudSave<T>): Promise<void>;
}

export type SyncResult = { direction: 'none' | 'upload' | 'download'; revision: number };

export async function syncCloudState<T>(
  repository: CloudRepository<T>,
  local: LocalCloudState<T>,
): Promise<SyncResult> {
  const localSave = await local.read();
  const remote = await repository.pullSave(localSave.userId);
  if (!remote) {
    const pushed = await repository.pushSave(localSave, 0);
    await local.markSynced(pushed);
    return { direction: 'upload', revision: pushed.revision };
  }
  const resolution = resolveCloudSave(localSave, remote);
  if (resolution.kind === 'remote') {
    await local.applyRemote(remote);
    await local.markSynced(remote);
    return { direction: 'download', revision: remote.revision };
  }
  if (resolution.kind === 'local') {
    const pushed = await repository.pushSave(localSave, remote.revision);
    await local.markSynced(pushed);
    return { direction: 'upload', revision: pushed.revision };
  }
  await local.markSynced(remote);
  return { direction: 'none', revision: remote.revision };
}
