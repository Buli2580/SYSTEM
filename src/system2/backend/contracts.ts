export interface DeviceRegistration {
  deviceId: string;
  platform: 'ios' | 'android' | 'web';
  appVersion: string;
  locale: string;
  timezone: string;
  pushToken?: string;
  lastSeenAt: string;
}

export interface CloudProfile {
  userId: string;
  displayName: string;
  locale: string;
  region: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface CloudSave<T> {
  userId: string;
  schemaVersion: number;
  revision: number;
  updatedAt: string;
  deviceId: string;
  data: T;
}

export interface CloudRepository<T> {
  getProfile(userId: string): Promise<CloudProfile | null>;
  upsertProfile(profile: CloudProfile): Promise<void>;
  registerDevice(userId: string, device: DeviceRegistration): Promise<void>;
  pullSave(userId: string): Promise<CloudSave<T> | null>;
  pushSave(save: CloudSave<T>, expectedRevision?: number): Promise<CloudSave<T>>;
  deleteUserData(userId: string): Promise<void>;
}
