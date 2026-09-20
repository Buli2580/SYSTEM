export type LocaleCode = 'pl-PL' | 'en-US';

export type GlobalFeature =
  | 'cloudSync' | 'aiGameMaster' | 'healthVerification' | 'social'
  | 'guilds' | 'premium' | 'sponsoredChallenges' | 'analytics';

export interface RuntimeCapabilities {
  locale: LocaleCode;
  region: string;
  features: Record<GlobalFeature, boolean>;
}

export interface AccountIdentity {
  userId: string;
  displayName: string;
  locale: LocaleCode;
  createdAt: string;
}

export interface SyncEnvelope<T> {
  schemaVersion: number;
  userId: string;
  deviceId: string;
  updatedAt: string;
  revision: number;
  payload: T;
}

export interface AnalyticsEvent {
  name: string;
  occurredAt: string;
  userId?: string;
  sessionId: string;
  properties?: Record<string, string | number | boolean | null>;
}
