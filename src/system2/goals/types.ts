// SYSTEM 2.0 — GOAL DOMAIN TYPES
// Player goals and related domain types

import type { SkillKey, Rank, QuestDifficulty } from '../core/types';

export type GoalType =
  | 'GET_FITTER'
  | 'LOSE_WEIGHT'
  | 'WALK_MORE'
  | 'RUN_5K'
  | 'BUILD_DISCIPLINE'
  | 'LEARN_SKILL'
  | 'STUDY'
  | 'READ_MORE'
  | 'SAVE_MONEY'
  | 'BUILD_PROJECT'
  | 'CUSTOM';

export type GoalStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'ABANDONED';

export type GoalPriority =
  | 'LOW'
  | 'NORMAL'
  | 'HIGH'
  | 'CRITICAL';

export type GoalDifficulty =
  | 'EASY'
  | 'NORMAL'
  | 'HARD'
  | 'EXTREME';

export type GoalPhaseStatus =
  | 'LOCKED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'SKIPPED';

export type MilestoneType =
  | 'PROGRESS'
  | 'CONSISTENCY'
  | 'QUEST_COUNT'
  | 'VERIFIED_ACTIVITY'
  | 'CUSTOM';

export type MilestoneStatus =
  | 'LOCKED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CLAIMED';

export type DifficultyAdjustment =
  | 'EASIER'
  | 'STABLE'
  | 'HARDER';

export type GameMasterMessageType =
  | 'SYSTEM_MESSAGE'
  | 'NEW_OBJECTIVE'
  | 'GOAL_UPDATE'
  | 'WARNING'
  | 'MILESTONE'
  | 'NEW_CHALLENGE'
  | 'WORLD_SIGNAL'
  | 'BOSS_AVAILABLE';

export type InboxMessagePriority =
  | 'LOW'
  | 'NORMAL'
  | 'HIGH'
  | 'URGENT';

export type QuestFeedbackType =
  | 'TOO_EASY'
  | 'GOOD'
  | 'TOO_HARD'
  | 'NOT_FOR_ME';

export type DifficultyAdjustmentSignal =
  | 'QUEST_COMPLETION_RATE'
  | 'RECENT_STREAK'
  | 'ABANDONED_QUESTS'
  | 'VERIFICATION_FAILURES'
  | 'TIME_TO_COMPLETION'
  | 'GOAL_PROGRESS'
  | 'PLAYER_FEEDBACK';

export type PreferenceKey =
  | 'preferredQuestLength'
  | 'preferredCategories'
  | 'preferredTimeWindows'
  | 'preferredDifficulty'
  | 'indoorOutdoorPreference'
  | 'explorationPreference'
  | 'socialPreference'
  | 'notificationPreference'
  | 'preferredIntensity'
  | 'preferredDays';

export interface Goal {
  id: string;
  type: GoalType;
  title: string;
  description: string;
  customTypeName?: string;
  createdAt: string;
  updatedAt: string;
  targetDate?: string;
  priority: GoalPriority;
  status: GoalStatus;
  difficulty: GoalDifficulty;
  motivation: string;
  preferredSchedule: PreferredSchedule;
  constraints: GoalConstraints;
  progress: number;
  progressTarget: number;
  milestones: GoalMilestone[];
  phases: GoalPhase[];
  linkedQuestIds: string[];
  linkedStatIds: SkillKey[];
  primary: boolean;
  startedAt?: string;
  completedAt?: string;
  abandonedAt?: string;
  pausedAt?: string;
  pausedReason?: string;
}

export interface PreferredSchedule {
  days: number[]; // 0-6 (Sunday-Saturday)
  timeWindows: TimeWindow[];
  intensity: 'LOW' | 'MODERATE' | 'HIGH';
}

export interface TimeWindow {
  start: string; // HH:MM
  end: string; // HH:MM
}

export interface GoalConstraints {
  maxSessionMinutes?: number;
  maxWeeklySessions?: number;
  healthLimitations?: string[];
  locationConstraints?: string[];
  budgetLimit?: number;
  equipmentRequired?: string[];
}

export interface GoalMilestone {
  id: string;
  goalId: string;
  type: MilestoneType;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  status: MilestoneStatus;
  reward: MilestoneReward;
  order: number;
  achievedAt?: string;
  claimedAt?: string;
}

export interface MilestoneReward {
  realXp: number;
  skillXp?: Partial<Record<string, number>>;
  gameEnergy?: number;
  title?: string;
  item?: string;
}

export interface GoalPhase {
  id: string;
  goalId: string;
  title: string;
  description: string;
  order: number;
  status: GoalPhaseStatus;
  milestones: string[]; // milestone IDs
  startedAt?: string;
  completedAt?: string;
}

export interface GoalPhaseStatus {
  phaseId: string;
  status: GoalPhaseStatus;
  completedAt?: string;
}

export interface DifficultyAdjustment {
  id: string;
  timestamp: string;
  previousDifficulty: GoalDifficulty;
  newDifficulty: GoalDifficulty;
  reason: string;
  signals: DifficultyAdjustmentSignal[];
  applied: boolean;
}

export interface DifficultyAdjustmentSignal {
  type: DifficultyAdjustmentSignal;
  value: number;
  threshold: number;
  description: string;
}

export interface AdaptiveDifficultyState {
  currentDifficulty: GoalDifficulty;
  lastAdjustmentAt?: string;
  adjustments: DifficultyAdjustment[];
  streak: number;
  completionRate: number;
  abandonedCount: number;
  verificationFailureRate: number;
  avgTimeToCompletion: number;
  goalProgress: number;
}

export interface PlayerPreferenceProfile {
  id: string;
  playerId: string;
  updatedAt: string;
  preferences: PreferenceValue[];
  learnedPreferences: LearnedPreference[];
}

export interface PreferenceValue {
  key: PreferenceKey;
  value: string | number | boolean | string[];
  explicit: boolean;
  updatedAt: string;
}

export interface LearnedPreference {
  key: string;
  value: string | number | boolean | string[];
  confidence: number;
  sampleCount: number;
  lastUpdated: string;
}

export interface QuestFeedback {
  id: string;
  questId: string;
  questTitle: string;
  type: QuestFeedbackType;
  difficultyRating: number; // 1-5
  enjoymentRating: number; // 1-5
  comment?: string;
  createdAt: string;
  usedForRecommendations: boolean;
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
}

export interface QuestSuggestion {
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

export interface GoalPlanSuggestion {
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

export interface GameMasterContext {
  activeGoals: Goal[];
  primaryGoal: Goal | null;
  playerLevel: number;
  recentQuestHistory: QuestHistoryEntry[];
  dailyProgress: DailyProgressSnapshot;
  streak: number;
  worldContext: WorldContext;
  availableCapabilities: CapabilityFlags;
  activeCampaignState: CampaignState | null;
}

export interface QuestHistoryEntry {
  questId: string;
  questTitle: string;
  completedAt: string;
  verificationType: string;
  xpAwarded: number;
  skillXpAwarded: Record<string, number>;
  difficulty: string;
}

export interface DailyProgressSnapshot {
  activeSlots: number;
  remainingCompletions: number;
  xpEarnedToday: number;
  xpBudget: number;
  completedCount: number;
  milestonesAchieved: number[];
  refillCount: number;
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

export interface GameMasterContext {
  activeGoals: Goal[];
  primaryGoal: Goal | null;
  playerLevel: number;
  recentQuestHistory: QuestHistoryEntry[];
  dailyProgress: DailyProgressSnapshot;
  streak: number;
  worldContext: WorldContext;
  availableCapabilities: CapabilityFlags;
  activeCampaignState: CampaignState | null;
}

export interface GameMasterRequest {
  id: string;
  type: 'NEXT_ACTION' | 'GOAL_PLAN' | 'QUEST_RECOMMENDATION' | 'DIFFICULTY_ADJUSTMENT' | 'NARRATIVE' | 'ADAPTATION';
  context: GameMasterContext;
  timestamp: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

export interface GameMasterSuggestion {
  id: string;
  requestId: string;
  type: 'NEXT_ACTION' | 'GOAL_PLAN' | 'QUEST_RECOMMENDATION' | 'DIFFICULTY_ADJUSTMENT' | 'NARRATIVE' | 'ADAPTATION';
  content: GameMasterSuggestionContent;
  confidence: number;
  reasoning: string;
  expiresAt?: string;
}

export type GameMasterSuggestionContent =
  | NextActionSuggestion
  | GoalPlanSuggestion
  | QuestSuggestion
  | DifficultyAdjustmentSuggestion
  | NarrativeSuggestion
  | AdaptationSuggestion;

export interface NextActionSuggestion {
  type: 'NEXT_ACTION';
  action: string;
  reason: string;
  questId?: string;
  goalId?: string;
  estimatedTimeMinutes: number;
  difficulty: string;
}

export interface GoalPlanSuggestion {
  type: 'GOAL_PLAN';
  goalId: string;
  plan: GoalPlanSuggestion;
}

export interface QuestSuggestion {
  type: 'QUEST_RECOMMENDATION';
  recommendations: QuestRecommendation[];
}

export interface DifficultyAdjustmentSuggestion {
  type: 'DIFFICULTY_ADJUSTMENT';
  adjustment: DifficultyAdjustment;
  signals: DifficultyAdjustmentSignal[];
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

export interface GameMasterInboxMessage {
  id: string;
  type: GameMasterMessageType;
  priority: InboxMessagePriority;
  createdAt: string;
  read: boolean;
  title: string;
  body: string;
  actionTarget?: string;
  expiryAt?: string;
  relatedGoalId?: string;
  relatedQuestId?: string;
}

export interface GoalJournalEntry {
  id: string;
  goalId: string;
  type: GoalJournalEventType;
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export type GoalJournalEventType =
  | 'GOAL_CREATED'
  | 'GOAL_ACTIVATED'
  | 'GOAL_PAUSED'
  | 'GOAL_RESUMED'
  | 'GOAL_COMPLETED'
  | 'PHASE_CHANGED'
  | 'MILESTONE_COMPLETED'
  | 'BOSS_COMPLETED'
  | 'GOAL_PAUSED'
  | 'GOAL_RESUMED'
  | 'GOAL_COMPLETED'
  | 'GOAL_ABANDONED';

export interface MorningBrief {
  id: string;
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

export interface EveningReport {
  id: string;
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
  skillXpEarned: Record<string, number>;
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

export interface GameMasterInboxMessage {
  id: string;
  type: 'SYSTEM_MESSAGE' | 'NEW_OBJECTIVE' | 'GOAL_UPDATE' | 'WARNING' | 'MILESTONE' | 'NEW_CHALLENGE' | 'WORLD_SIGNAL' | 'BOSS_AVAILABLE';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  createdAt: string;
  read: boolean;
  title: string;
  body: string;
  actionTarget?: string;
  expiryAt?: string;
  relatedGoalId?: string;
  relatedQuestId?: string;
}

export interface GoalDashboardData {
  primaryGoal: Goal | null;
  otherGoals: Goal[];
  primaryGoalProgress: number;
  primaryGoalPhase: string;
  nextMilestone: GoalMilestone | null;
  recommendedAction: MorningBriefAction | null;
  recentProgress: GoalJournalEntry[];
  recentFeedback: QuestFeedback[];
  recommendations: QuestRecommendation[];
}

export interface GoalCompletionData {
  goalId: string;
  completedAt: string;
  totalTimeDays: number;
  questsCompleted: number;
  totalXpEarned: number;
  milestonesCompleted: number;
  verifiedActivities: number;
  summary: string;
  shareableCard: ShareableCard;
}

export interface ShareableCard {
  id: string;
  type: 'GOAL_COMPLETION' | 'MILESTONE' | 'DAILY_REPORT' | 'BOSS_DEFEATED';
  title: string;
  imageUrl?: string;
  text: string;
  data: Record<string, unknown>;
  createdAt: string;
}

export interface GoalWizardState {
  step: number;
  maxSteps: number;
  data: Partial<Goal>;
}

export interface GoalWizardStep {
  id: string;
  title: string;
  component: React.ComponentType<GoalWizardStepProps>;
  validate: (data: Partial<Goal>) => { valid: boolean; errors: string[] };
}

export interface GoalWizardStepProps {
  data: Partial<Goal>;
  onChange: (data: Partial<Goal>) => void;
  onNext: () => void;
  onBack: () => void;
}