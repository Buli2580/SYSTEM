export type CloudAuthMode = 'GUEST' | 'AUTHENTICATED';

export type CloudConnectionState = 'OFFLINE' | 'CONNECTING' | 'ONLINE' | 'ERROR';

export interface CloudUser {
  id: string;
  email: string;
  created_at: string;
}

export interface CloudProfile {
  user_id: string;
  display_name: string;
  real_level: number;
  real_xp: number;
  total_real_xp: number;
  rank: string;
  game_energy: number;
  total_distance_meters: number;
  discovered_sectors: number;
  verified_quest_count: number;
  updated_at: string;
}

export interface CloudSkillProgress {
  user_id: string;
  skill_key: string;
  level: number;
  xp: number;
  xp_to_next_level: number;
  total_xp: number;
}

export interface CloudQuestCompletion {
  user_id: string;
  quest_id: string;
  completed_at: string;
  verification_type: string;
  verification_score: number;
  distance_meters: number | null;
  duration_seconds: number | null;
}

export interface CloudStoryProgress {
  user_id: string;
  chapter_id: string;
  completed_at: string;
}

export interface CloudSyncStatus {
  lastSyncAt: string | null;
  pendingChanges: number;
  conflictCount: number;
  error: string | null;
}

export interface CloudState {
  mode: CloudAuthMode;
  connectionState: CloudConnectionState;
  user: CloudUser | null;
  profile: CloudProfile | null;
  skills: CloudSkillProgress[];
  questCompletions: CloudQuestCompletion[];
  storyProgress: CloudStoryProgress[];
  syncStatus: CloudSyncStatus;
}

export interface AuthStateListener {
  (state: CloudAuthMode, user: CloudUser | null): void;
}

export interface ConnectionStateListener {
  (state: CloudConnectionState): void;
}

export const DEFAULT_CLOUD_STATE: CloudState = {
  mode: 'GUEST',
  connectionState: 'OFFLINE',
  user: null,
  profile: null,
  skills: [],
  questCompletions: [],
  storyProgress: [],
  syncStatus: {
    lastSyncAt: null,
    pendingChanges: 0,
    conflictCount: 0,
    error: null,
  },
};