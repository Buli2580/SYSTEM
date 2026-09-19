// SYSTEM 2.0 — GAME MASTER TYPES
// Core types for the Game Master engine

import type { Goal, GoalDifficulty, GoalStatus, GoalPriority, GoalType, QuestFeedbackType, DifficultyAdjustmentSignal, DifficultyAdjustmentSignalType, DifficultyAdjustmentDirection, PreferenceKey, GoalPhaseStatusType, MilestoneType, MilestoneStatus, GoalMilestone, GoalPhase, GoalConstraints, PreferredSchedule, TimeWindow, MilestoneReward, GoalJournalEntry, QuestFeedback, AdaptiveDifficultyState, PlayerPreferenceProfile, PreferenceValue, LearnedPreference } from '../goals/types';
import type { PlayerProfile, VerifiedEvent, SkillKey, QuestDifficulty, QuestCategory, QuestVerification, QuestReward, GeoPoint } from '../core/types';
import type { DailyState } from '../storage/daily';
import type { RunnableQuest } from '../quests/types';
import type { BossDetailed } from '../storage/database';

export type GameMasterRequestType =
  | 'NEXT_ACTION'
  | 'GOAL_PLAN'
  | 'QUEST_RECOMMENDATION'
  | 'DIFFICULTY_ADJUSTMENT'
  | 'NARRATIVE'
  | 'ADAPTATION'
  | 'MORNING_BRIEF'
  | 'EVENING_REPORT';

export type GameMasterPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type GameMasterSuggestionType =
  | 'NEXT_ACTION'
  | 'GOAL_PLAN'
  | 'QUEST_RECOMMENDATION'
  | 'DIFFICULTY_ADJUSTMENT'
  | 'NARRATIVE'
  | 'ADAPTATION'
  | 'MORNING_BRIEF'
  | 'EVENING_REPORT';

export interface GameMasterContext {
  activeGoals: Goal[];
  primaryGoal: Goal | null;
  player: PlayerProfile;
  recentQuestHistory: QuestHistoryEntry[];
  dailyProgress: DailyProgressSnapshot;
  daily: DailyState | null;
  streak: number;
  worldContext: WorldContext;
  availableCapabilities: CapabilityFlags;
  activeCampaignState: CampaignState | null;
  activeBoss: BossDetailed | null;
  completedQuestIds: string[];
  awakeningCompleted: boolean;
  worldUnlocked: boolean;
}

export interface QuestHistoryEntry {
  questId: string;
  questTitle: string;
  completedAt: string;
  verificationType: string;
  xpAwarded: number;
  skillXpAwarded: Record<SkillKey, number>;
  difficulty: QuestDifficulty;
  category: QuestCategory;
  durationSeconds?: number;
  distanceMeters?: number;
}

export interface DailyProgressSnapshot {
  activeSlots: number;
  remainingCompletions: number;
  xpEarnedToday: number;
  xpBudget: number;
  completedCount: number;
  milestonesAchieved: number[];
  refillCount: number;
  dayKey: string;
  isComplete: boolean;
}

export interface WorldContext {
  currentSector: string | null;
  nearbySignals: number;
  nearbyCaches: number;
  nearbyAnomalies: number;
  nearbyBosses: number;
  nearbyLandmarks: number;
  currentArea: string | null;
  currentRegion: string | null;
  safetyRating: 'SAFE' | 'CAUTION' | 'DANGEROUS';
}

export interface CapabilityFlags {
  hasGPS: boolean;
  hasMotion: boolean;
  hasCamera: boolean;
  hasMicrophone: boolean;
  hasInternet: boolean;
  worldUnlocked: boolean;
}

export interface CampaignState {
  activeCampaignId: string | null;
  currentChapter: number;
  currentMission: string | null;
  completedMissions: string[];
  completedChapters: string[];
}

export interface GameMasterRequest {
  id: string;
  type: GameMasterRequestType;
  context: GameMasterContext;
  timestamp: string;
  priority: GameMasterPriority;
}

export interface GameMasterSuggestion {
  id: string;
  requestId: string;
  type: GameMasterSuggestionType;
  content: GameMasterSuggestionContent;
  confidence: number;
  reasoning: string;
  expiresAt?: string;
}

export type GameMasterSuggestionContent =
  | NextActionSuggestion
  | GoalPlanSuggestion
  | QuestRecommendationSuggestion
  | DifficultyAdjustmentSuggestion
  | NarrativeSuggestion
  | AdaptationSuggestion
  | MorningBriefSuggestion
  | EveningReportSuggestion;

export interface NextActionSuggestion {
  type: 'NEXT_ACTION';
  action: string;
  reason: string;
  questId?: string;
  goalId?: string;
  estimatedTimeMinutes: number;
  difficulty: QuestDifficulty;
  priority: number;
}

export interface GoalPlanSuggestion {
  type: 'GOAL_PLAN';
  goalId: string;
  planTitle: string;
  phases: GoalPhase[];
  milestones: GoalMilestone[];
  weeklyTarget: number;
  dailyTarget: number;
  bossMoments: BossMoment[];
  difficulty: GoalDifficulty;
  estimatedDurationDays: number;
}

export interface BossMoment {
  id: string;
  phaseId: string;
  title: string;
  description: string;
  bossId: string;
  triggerCondition: string;
  reward: MilestoneReward;
  order: number;
}

export interface QuestRecommendationSuggestion {
  type: 'QUEST_RECOMMENDATION';
  recommendations: QuestRecommendation[];
}

export interface QuestRecommendation {
  questId: string;
  questTitle: string;
  score: number;
  reasons: string[];
  explanation: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedTimeMinutes: number;
  difficulty: QuestDifficulty;
  goalId?: string;
}

export interface DifficultyAdjustmentSuggestion {
  type: 'DIFFICULTY_ADJUSTMENT';
  adjustment: GoalDifficulty;
  previousDifficulty: GoalDifficulty;
  signals: DifficultyAdjustmentSignalData[];
  reason: string;
}

export interface DifficultyAdjustmentSignalData {
  type: DifficultyAdjustmentSignalType;
  value: number;
  threshold: number;
  description: string;
}

export interface NarrativeSuggestion {
  type: 'NARRATIVE';
  title: string;
  body: string;
  tone: 'ENCOURAGING' | 'CHALLENGING' | 'NEUTRAL' | 'CELEBRATORY';
  durationSeconds: number;
}

export interface AdaptationSuggestion {
  type: 'ADAPTATION';
  adaptation: string;
  reason: string;
  affectsGoals: string[];
  expiresAt?: string;
}

export interface MorningBriefSuggestion {
  type: 'MORNING_BRIEF';
  date: string;
  primaryGoal: Goal | null;
  todaysQuests: MorningBriefQuest[];
  goalQuest: MorningBriefQuest | null;
  worldOpportunities: WorldOpportunity[];
  streak: number;
  nextMilestone: { title: string; progress: number; target: number } | null;
  recommendedFirstAction: MorningBriefAction | null;
  systemAssessment: string;
}

export interface MorningBriefQuest {
  questId: string;
  title: string;
  type: 'DAILY' | 'GOAL' | 'FIELD' | 'WORLD';
  progress: number;
  target: number;
  xpReward: number;
}

export interface WorldOpportunity {
  id: string;
  type: 'SIGNAL' | 'CACHE' | 'ANOMALY' | 'LANDMARK' | 'BOSS' | 'LANDMARK_VISIT';
  title: string;
  distanceMeters: number;
  xpReward: number;
  timeEstimateMinutes: number;
}

export interface MorningBriefAction {
  type: 'START_QUEST' | 'CONTINUE_GOAL' | 'CHECK_WORLD' | 'CHECK_SIGNALS';
  label: string;
  actionTarget: string;
  estimatedMinutes: number;
}

export interface EveningReportSuggestion {
  type: 'EVENING_REPORT';
  date: string;
  completedQuests: EveningReportQuest[];
  goalProgress: GoalProgressSummary[];
  totalXpEarned: number;
  totalDistanceMeters: number;
  streak: number;
  milestonesCompleted: number[];
  discoveries: DiscoverySummary[];
  systemAssessment: string;
}

export interface EveningReportQuest {
  questId: string;
  title: string;
  type: string;
  xpEarned: number;
  skillXpEarned: Record<SkillKey, number>;
  energyEarned: number;
  distanceMeters: number;
  durationSeconds: number;
  verificationType: string;
}

export interface GoalProgressSummary {
  goalId: string;
  goalTitle: string;
  progressBefore: number;
  progressAfter: number;
  milestonesCompleted: number;
  xpContribution: number;
}

export interface DiscoverySummary {
  id: string;
  type: string;
  title: string;
  distanceMeters: number;
  xpReward: number;
}

export interface GameMasterConfig {
  maxQuestRecommendations: number;
  difficultyAdaptationEnabled: boolean;
  minDifficultyAdjustmentIntervalHours: number;
  maxDifficultyStep: number;
  safetyLimits: SafetyLimits;
}

export interface SafetyLimits {
  maxSessionMinutes: number;
  maxDailyActiveMinutes: number;
  minRestHoursBetweenSessions: number;
  prohibitedActivities: string[];
  maxIntensityForLevel: Record<number, number>;
}

export interface QuestTemplate {
  id: string;
  title: string;
  description: string;
  category: QuestCategory;
  difficulty: QuestDifficulty;
  primarySkill: SkillKey;
  secondarySkills: SkillKey[];
  verification: QuestVerification;
  rewards: QuestReward;
  estimatedDurationMinutes: number;
  goalTypes: GoalType[];
  minPlayerLevel: number;
  maxPlayerLevel?: number;
  tags: string[];
}

export interface GeneratedQuest extends QuestTemplate {
  generatedAt: string;
  goalId: string;
  parameters: Record<string, number | string>;
}

export type GameMasterEventType =
  | 'goal_created'
  | 'goal_updated'
  | 'goal_archived'
  | 'gamemaster_recommendation_generated'
  | 'gamemaster_quest_started'
  | 'gamemaster_difficulty_adjusted'
  | 'gamemaster_narrative_shown'
  | 'morning_brief_generated'
  | 'evening_report_generated';

export interface GameMasterTelemetryEvent {
  event: GameMasterEventType;
  properties: Record<string, string | number | boolean | undefined>;
  timestamp: number;
}

// Re-export goal types for convenience
export type {
  Goal,
  GoalDifficulty,
  GoalStatus,
  GoalPriority,
  GoalType,
  QuestFeedbackType,
  DifficultyAdjustmentSignal,
  DifficultyAdjustmentSignalType,
  DifficultyAdjustmentDirection,
  PreferenceKey,
  GoalPhaseStatusType,
  MilestoneType,
  MilestoneStatus,
  GoalMilestone,
  GoalPhase,
  GoalConstraints,
  PreferredSchedule,
  TimeWindow,
  MilestoneReward,
  GoalJournalEntry,
  QuestFeedback,
  AdaptiveDifficultyState,
  PlayerPreferenceProfile,
  PreferenceValue,
  LearnedPreference,
} from '../goals/types';

export type {
  SkillKey,
  QuestDifficulty,
  QuestCategory,
  QuestVerification,
  QuestReward,
  GeoPoint,
  PlayerProfile,
  VerifiedEvent,
} from '../core/types';

export type { DailyState } from '../storage/daily';
export type { RunnableQuest } from '../quests/types';
export type { BossDetailed } from '../storage/database';