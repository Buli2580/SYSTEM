// SYSTEM 2.0
// Główne typy całej aplikacji.
// Ta warstwa ma być niezależna od wyglądu UI.

export type SkillKey =
  | 'STR'
  | 'VIT'
  | 'INT'
  | 'WIL'
  | 'CHA'
  | 'CRE'
  | 'RES';

export type Rank =
  | 'E'
  | 'D'
  | 'C'
  | 'B'
  | 'A'
  | 'S'
  | 'SS'
  | 'SSS'
  | 'ASCENDED';

export type PlayerMode =
  | 'JUNIOR'
  | 'STANDARD'
  | 'SIMPLE';

export type QuestDifficulty =
  | 'EASY'
  | 'NORMAL'
  | 'HARD'
  | 'EXTREME';

export type QuestCategory =
  | 'DAILY'
  | 'MAIN'
  | 'SIDE'
  | 'WEEKLY'
  | 'EXPLORATION'
  | 'BOSS'
  | 'PARTY'
  | 'CLAN'
  | 'FAMILY'
  | 'WORLD'
  | 'HIDDEN';

export type VerificationType =
  | 'NONE'
  | 'TIMER'
  | 'GPS_DISTANCE'
  | 'GPS_LOCATION'
  | 'STEPS'
  | 'PHOTO'
  | 'PHOTO_BEFORE_AFTER'
  | 'QR'
  | 'NFC'
  | 'HEALTH'
  | 'PARENT_APPROVAL'
  | 'MULTI';

export type QuestStatus =
  | 'LOCKED'
  | 'AVAILABLE'
  | 'ACTIVE'
  | 'VERIFYING'
  | 'COMPLETED'
  | 'FAILED';

export interface SkillProgress {
  key: SkillKey;
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalXp: number;
}

export interface PlayerStats {
  STR: SkillProgress;
  VIT: SkillProgress;
  INT: SkillProgress;
  WIL: SkillProgress;
  CHA: SkillProgress;
  CRE: SkillProgress;
  RES: SkillProgress;
}

export interface PlayerProfile {
  id: string;

  displayName: string;

  // RULE #1 — EQUAL ORIGIN
  // Każdy zaczyna dokładnie tak samo.
  realLevel: number;
  realXp: number;
  realXpToNextLevel: number;
  totalRealXp: number;

  rank: Rank;

  stats: PlayerStats;

  streak: number;
  verifiedQuestCount: number;

  createdAt: string;
  updatedAt: string;

  mode: PlayerMode;

  avatarUri?: string;
  avatarEvolution: number;

  clanId?: string;

  discoveredSectors: number;
  totalDistanceMeters: number;

  gameEnergy: number;
}

export interface QuestReward {
  realXp: number;

  skillXp?: Partial<Record<SkillKey, number>>;

  gameEnergy?: number;
  coins?: number;

  chest?: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface QuestCheckpoint {
  id: string;

  title: string;

  location?: GeoPoint;
  radiusMeters?: number;

  requiresPhoto?: boolean;

  completed: boolean;
}

export interface QuestVerification {
  type: VerificationType;

  minimumDurationSeconds?: number;
  minimumDistanceMeters?: number;
  minimumSteps?: number;

  targetLocation?: GeoPoint;
  radiusMeters?: number;

  requiresPhoto?: boolean;

  verificationScoreRequired?: number;
}

export interface Quest {
  id: string;

  title: string;
  description: string;

  category: QuestCategory;
  difficulty: QuestDifficulty;

  status: QuestStatus;

  primarySkill: SkillKey;

  secondarySkills?: SkillKey[];

  verification: QuestVerification;

  rewards: QuestReward;

  checkpoints?: QuestCheckpoint[];

  progress: number;
  progressTarget: number;

  createdAt: string;

  startedAt?: string;
  completedAt?: string;

  chapter?: number;
  arc?: string;

  hidden?: boolean;
}

export interface VerifiedEvent {
  id: string;

  playerId: string;
  questId: string;

  createdAt: string;

  verificationType: VerificationType;
  verificationScore: number;

  verified: boolean;

  realXpAwarded: number;

  skillXpAwarded: Partial<Record<SkillKey, number>>;

  gameEnergyAwarded: number;

  distanceMeters?: number;
  durationSeconds?: number;
  steps?: number;

  latitude?: number;
  longitude?: number;
}

export interface SystemSave {
  version: number;

  player: PlayerProfile;

  quests: Quest[];

  verifiedEvents: VerifiedEvent[];

  lastSavedAt: string;
}