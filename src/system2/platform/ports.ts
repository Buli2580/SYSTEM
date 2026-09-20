import type { AccountIdentity, AnalyticsEvent, SyncEnvelope } from './contracts';

export interface AuthPort {
  currentUser(): Promise<AccountIdentity | null>;
  signOut(): Promise<void>;
  deleteAccount(): Promise<void>;
}

export interface CloudSyncPort<T> {
  pull(userId: string): Promise<SyncEnvelope<T> | null>;
  push(envelope: SyncEnvelope<T>): Promise<{ revision: number }>;
}

export interface AnalyticsPort {
  track(event: AnalyticsEvent): Promise<void>;
  flush(): Promise<void>;
}

export interface FeatureFlagPort {
  enabled(flag: string, userId?: string): Promise<boolean>;
}
