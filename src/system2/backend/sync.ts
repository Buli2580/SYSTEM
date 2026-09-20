import type { CloudSave } from './contracts';

export type SyncResolution<T> =
  | { kind: 'local'; value: CloudSave<T> }
  | { kind: 'remote'; value: CloudSave<T> }
  | { kind: 'equal'; value: CloudSave<T> };

export function resolveCloudSave<T>(
  local: CloudSave<T>,
  remote: CloudSave<T>,
): SyncResolution<T> {
  if (local.revision > remote.revision) return { kind: 'local', value: local };
  if (remote.revision > local.revision) return { kind: 'remote', value: remote };

  const localTime = Date.parse(local.updatedAt);
  const remoteTime = Date.parse(remote.updatedAt);
  if (localTime > remoteTime) return { kind: 'local', value: local };
  if (remoteTime > localTime) return { kind: 'remote', value: remote };
  return { kind: 'equal', value: remote };
}

export function nextCloudSave<T>(
  previous: CloudSave<T> | null,
  input: Omit<CloudSave<T>, 'revision'>,
): CloudSave<T> {
  return { ...input, revision: (previous?.revision ?? 0) + 1 };
}
