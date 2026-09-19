// SYSTEM 2.0 — QUEST CHAIN ENGINE
// Generic multi-stage quest chains with AWAKENING starter

import type { Quest, QuestReward, QuestDifficulty, QuestCategory, SkillKey, QuestVerification } from '../core/types';
import type { GeoPoint } from '../core';

export type ChainStageStatus = 'LOCKED' | 'AVAILABLE' | 'ACTIVE' | 'COMPLETED' | 'FAILED';

export interface ChainStage {
  stageId: string;
  chainId: string;
  order: number;
  title: string;
  description: string;
  questTemplate: QuestTemplate;
  requirements: StageRequirement[];
  unlockConditions: UnlockCondition[];
  reward: StageReward;
  status: ChainStageStatus;
  progress: number;
  startedAt?: string;
  completedAt?: string;
}

export interface QuestTemplate {
  category: QuestCategory;
  difficulty: QuestDifficulty;
  primarySkill: SkillKey;
  secondarySkills: SkillKey[];
  verification: QuestVerification;
  baseRewards: QuestReward;
  targetType?: 'SECTOR' | 'LANDMARK' | 'CACHE' | 'ANOMALY' | 'SIGNAL' | 'DISTANCE' | 'AREA';
  targetCount?: number;
}

export type StageRequirement =
  | { type: 'QUEST_COMPLETE'; questId: string }
  | { type: 'SECTOR_DISCOVERED'; sectorId?: string; count?: number }
  | { type: 'LANDMARK_VISITED'; landmarkId?: string; count?: number }
  | { type: 'DISTANCE_WALKED'; meters: number }
  | { type: 'LEVEL_REACHED'; level: number }
  | { type: 'EXPLORER_RANK'; rank: number }
  | { type: 'TIME_ELAPSED'; hours: number }
  | { type: 'WORLD_EVENT_ACTIVE'; eventType: string };

export type UnlockCondition =
  | { type: 'PREVIOUS_STAGE_COMPLETE' }
  | { type: 'ALL_REQUIREMENTS_MET' }
  | { type: 'TIME_BASED'; hoursAfterPrevious: number }
  | { type: 'PLAYER_LEVEL'; minLevel: number }
  | { type: 'EXPLORER_RANK'; minRank: number };

export interface StageReward {
  realXp: number;
  skillXp: Partial<Record<SkillKey, number>>;
  gameEnergy: number;
  chainProgress: number;
  unlocks?: string[];
}

export interface QuestChain {
  chainId: string;
  name: string;
  description: string;
  stages: ChainStage[];
  currentStage: number;
  status: 'LOCKED' | 'ACTIVE' | 'COMPLETED' | 'FAILED';
  startedAt?: string;
  completedAt?: string;
  totalProgress: number;
  totalStages: number;
  rewards: ChainReward[];
  claimedRewards: string[];
  metadata: ChainMetadata;
}

export interface ChainReward {
  rewardId: string;
  type: 'REAL_XP' | 'SKILL_XP' | 'GAME_ENERGY' | 'ITEM' | 'TITLE' | 'UNLOCK';
  value: number | string;
  skillKey?: SkillKey;
  claimed: boolean;
  claimedAt?: string;
  unlocksChainId?: string;
}

export interface ChainMetadata {
  isStarter: boolean;
  difficulty: 'EASY' | 'NORMAL' | 'HARD' | 'ELITE';
  estimatedDurationHours: number;
  worldContextAffinity?: string[];
  repeatable: boolean;
  cooldownHours?: number;
}

export interface ChainState {
  chains: Map<string, QuestChain>;
  activeChainId?: string;
  completedChains: string[];
  lastUpdatedAt: string;
}

export function createChainState(): ChainState {
  return {
    chains: new Map(),
    completedChains: [],
    lastUpdatedAt: new Date().toISOString(),
  };
}

export function addChain(state: ChainState, chain: QuestChain): ChainState {
  const newState = { ...state, chains: new Map(state.chains) };
  newState.chains.set(chain.chainId, chain);
  newState.lastUpdatedAt = new Date().toISOString();
  return newState;
}

export function getChain(state: ChainState, chainId: string): QuestChain | undefined {
  return state.chains.get(chainId);
}

export function getActiveChain(state: ChainState): QuestChain | undefined {
  if (!state.activeChainId) return undefined;
  return state.chains.get(state.activeChainId);
}

export function startChain(state: ChainState, chainId: string): ChainState {
  const chain = state.chains.get(chainId);
  if (!chain || chain.status !== 'LOCKED') return state;

  const newChain = {
    ...chain,
    status: 'ACTIVE' as const,
    startedAt: new Date().toISOString(),
    currentStage: 0,
    stages: chain.stages.map((s, i) => ({
      ...s,
      status: i === 0 ? 'AVAILABLE' as ChainStageStatus : 'LOCKED' as ChainStageStatus,
    })),
  };

  const newState = { ...state, chains: new Map(state.chains), activeChainId: chainId };
  newState.chains.set(chainId, newChain);
  newState.lastUpdatedAt = new Date().toISOString();
  return newState;
}

export function advanceChainStage(state: ChainState, chainId: string): ChainState {
  const chain = state.chains.get(chainId);
  if (!chain || chain.status !== 'ACTIVE') return state;

  const currentStage = chain.stages[chain.currentStage];
  if (!currentStage || currentStage.status !== 'COMPLETED') return state;

  const nextStageIndex = chain.currentStage + 1;
  if (nextStageIndex >= chain.stages.length) {
    return completeChain(state, chainId);
  }

  const newStages = [...chain.stages];
  newStages[chain.currentStage] = { ...currentStage, status: 'COMPLETED' };
  newStages[nextStageIndex] = { ...newStages[nextStageIndex], status: 'AVAILABLE' };

  const newChain = {
    ...chain,
    currentStage: nextStageIndex,
    stages: newStages,
    totalProgress: calculateChainProgress(newStages),
  };

  const newState = { ...state, chains: new Map(state.chains) };
  newState.chains.set(chainId, newChain);
  newState.lastUpdatedAt = new Date().toISOString();
  return newState;
}

export function updateStageProgress(state: ChainState, chainId: string, stageId: string, progress: number): ChainState {
  const chain = state.chains.get(chainId);
  if (!chain) return state;

  const stageIndex = chain.stages.findIndex(s => s.stageId === stageId);
  if (stageIndex === -1) return state;

  const stage = chain.stages[stageIndex];
  const newStage = { ...stage, progress: Math.min(progress, 100) };
  if (newStage.progress >= 100 && newStage.status === 'ACTIVE') {
    newStage.status = 'COMPLETED';
    newStage.completedAt = new Date().toISOString();
  } else if (newStage.progress > 0 && newStage.status === 'AVAILABLE') {
    newStage.status = 'ACTIVE';
    newStage.startedAt = new Date().toISOString();
  }

  const newStages = [...chain.stages];
  newStages[stageIndex] = newStage;

  const newChain = {
    ...chain,
    stages: newStages,
    totalProgress: calculateChainProgress(newStages),
  };

  const newState = { ...state, chains: new Map(state.chains) };
  newState.chains.set(chainId, newChain);
  newState.lastUpdatedAt = new Date().toISOString();
  return newState;
}

export function completeChain(state: ChainState, chainId: string): ChainState {
  const chain = state.chains.get(chainId);
  if (!chain) return state;

  const newChain = {
    ...chain,
    status: 'COMPLETED' as const,
    completedAt: new Date().toISOString(),
    currentStage: chain.stages.length,
    stages: chain.stages.map(s => ({ ...s, status: 'COMPLETED' as ChainStageStatus })),
    totalProgress: 100,
  };

  const newState = { ...state, chains: new Map(state.chains), activeChainId: undefined };
  newState.chains.set(chainId, newChain);
  newState.completedChains = [...state.completedChains, chainId];
  newState.lastUpdatedAt = new Date().toISOString();
  return newState;
}

export function claimChainReward(state: ChainState, chainId: string, rewardId: string): { state: ChainState; reward: ChainReward | null } {
  const chain = state.chains.get(chainId);
  if (!chain) return { state, reward: null };

  const reward = chain.rewards.find(r => r.rewardId === rewardId);
  if (!reward || reward.claimed) return { state, reward: null };

  const updatedReward = { ...reward, claimed: true, claimedAt: new Date().toISOString() };
  const newChain = {
    ...chain,
    rewards: chain.rewards.map(r => r.rewardId === rewardId ? updatedReward : r),
    claimedRewards: [...chain.claimedRewards, rewardId],
  };

  const newState = { ...state, chains: new Map(state.chains) };
  newState.chains.set(chainId, newChain);
  newState.lastUpdatedAt = new Date().toISOString();
  return { state: newState, reward: updatedReward };
}

export function isChainAvailable(state: ChainState, chainId: string): boolean {
  const chain = state.chains.get(chainId);
  if (!chain) return false;
  if (chain.status !== 'LOCKED') return false;
  if (state.completedChains.includes(chainId) && !chain.metadata.repeatable) return false;
  return true;
}

export function getNextAvailableStage(chain: QuestChain): ChainStage | null {
  return chain.stages.find(s => s.status === 'AVAILABLE') || null;
}

export function getChainProgress(chain: QuestChain): number {
  return chain.totalProgress;
}

export function calculateChainProgress(stages: ChainStage[]): number {
  if (stages.length === 0) return 0;
  const completed = stages.filter(s => s.status === 'COMPLETED').length;
  return Math.round((completed / stages.length) * 100);
}

export function checkStageRequirements(
  stage: ChainStage,
  playerState: { discoveredSectors: Set<string>; visitedLandmarks: Set<string>; completedQuests: Set<string>; totalDistance: number; level: number; explorerRank: number; activeWorldEvents: string[] }
): boolean {
  for (const req of stage.requirements) {
    switch (req.type) {
      case 'QUEST_COMPLETE':
        if (!playerState.completedQuests.has(req.questId)) return false;
        break;
      case 'SECTOR_DISCOVERED':
        if (req.sectorId && !playerState.discoveredSectors.has(req.sectorId)) return false;
        if (req.count && playerState.discoveredSectors.size < req.count) return false;
        break;
      case 'LANDMARK_VISITED':
        if (req.landmarkId && !playerState.visitedLandmarks.has(req.landmarkId)) return false;
        if (req.count && playerState.visitedLandmarks.size < req.count) return false;
        break;
      case 'DISTANCE_WALKED':
        if (playerState.totalDistance < req.meters) return false;
        break;
      case 'LEVEL_REACHED':
        if (playerState.level < req.level) return false;
        break;
      case 'EXPLORER_RANK':
        if (playerState.explorerRank < req.rank) return false;
        break;
      case 'WORLD_EVENT_ACTIVE':
        if (!playerState.activeWorldEvents.includes(req.eventType)) return false;
        break;
    }
  }
  return true;
}

export function checkUnlockConditions(stage: ChainStage, playerState: { level: number; explorerRank: number; previousStageCompleted: boolean; timeSincePreviousStageHours: number }): boolean {
  for (const cond of stage.unlockConditions) {
    switch (cond.type) {
      case 'PREVIOUS_STAGE_COMPLETE':
        if (!playerState.previousStageCompleted) return false;
        break;
      case 'ALL_REQUIREMENTS_MET':
        break;
      case 'TIME_BASED':
        if (playerState.timeSincePreviousStageHours < cond.hoursAfterPrevious) return false;
        break;
      case 'PLAYER_LEVEL':
        if (playerState.level < cond.minLevel) return false;
        break;
      case 'EXPLORER_RANK':
        if (playerState.explorerRank < cond.minRank) return false;
        break;
    }
  }
  return true;
}

export const AWAKENING_CHAIN: QuestChain = {
  chainId: 'awakening',
  name: 'The Awakening',
  description: 'Your first steps into the SYSTEM world. Discover your surroundings and learn the basics of exploration.',
  stages: [
    {
      stageId: 'awakening_1',
      chainId: 'awakening',
      order: 1,
      title: 'First Signal',
      description: 'Detect your first world signal and understand the basics of GPS-based exploration.',
      questTemplate: {
        category: 'WORLD',
        difficulty: 'EASY',
        primarySkill: 'RES',
        secondarySkills: ['VIT'],
        verification: { type: 'GPS_LOCATION', radiusMeters: 100, verificationScoreRequired: 70 },
        baseRewards: { realXp: 100, skillXp: { RES: 50 }, gameEnergy: 10 },
        targetType: 'SECTOR',
        targetCount: 1,
      },
      requirements: [],
      unlockConditions: [{ type: 'PREVIOUS_STAGE_COMPLETE' }],
      reward: { realXp: 100, skillXp: { RES: 50 }, gameEnergy: 10, chainProgress: 20 },
      status: 'LOCKED',
      progress: 0,
    },
    {
      stageId: 'awakening_2',
      chainId: 'awakening',
      order: 2,
      title: 'Signal Hunter',
      description: 'Locate and reach your first signal to prove your navigation skills.',
      questTemplate: {
        category: 'WORLD',
        difficulty: 'EASY',
        primarySkill: 'RES',
        secondarySkills: ['INT'],
        verification: { type: 'GPS_LOCATION', radiusMeters: 40, verificationScoreRequired: 85 },
        baseRewards: { realXp: 200, skillXp: { RES: 80, INT: 40 }, gameEnergy: 15 },
        targetType: 'SIGNAL',
        targetCount: 1,
      },
      requirements: [{ type: 'QUEST_COMPLETE', questId: 'first_world_signal_v1' }],
      unlockConditions: [{ type: 'PREVIOUS_STAGE_COMPLETE' }],
      reward: { realXp: 200, skillXp: { RES: 80, INT: 40 }, gameEnergy: 15, chainProgress: 40 },
      status: 'LOCKED',
      progress: 0,
    },
    {
      stageId: 'awakening_3',
      chainId: 'awakening',
      order: 3,
      title: 'Sector Explorer',
      description: 'Discover 3 new sectors to expand your known world.',
      questTemplate: {
        category: 'WORLD',
        difficulty: 'NORMAL',
        primarySkill: 'RES',
        secondarySkills: ['VIT', 'CRE'],
        verification: { type: 'GPS_DISTANCE', minimumDistanceMeters: 1000, verificationScoreRequired: 80 },
        baseRewards: { realXp: 300, skillXp: { RES: 100, VIT: 50, CRE: 50 }, gameEnergy: 20 },
        targetType: 'SECTOR',
        targetCount: 3,
      },
      requirements: [{ type: 'SECTOR_DISCOVERED', count: 3 }],
      unlockConditions: [{ type: 'PREVIOUS_STAGE_COMPLETE' }],
      reward: { realXp: 300, skillXp: { RES: 100, VIT: 50, CRE: 50 }, gameEnergy: 20, chainProgress: 60 },
      status: 'LOCKED',
      progress: 0,
    },
    {
      stageId: 'awakening_4',
      chainId: 'awakening',
      order: 4,
      title: 'Landmark Visitor',
      description: 'Visit your first discovered landmark to claim it for your codex.',
      questTemplate: {
        category: 'WORLD',
        difficulty: 'NORMAL',
        primarySkill: 'CRE',
        secondarySkills: ['RES', 'INT'],
        verification: { type: 'GPS_LOCATION', radiusMeters: 50, verificationScoreRequired: 90 },
        baseRewards: { realXp: 250, skillXp: { CRE: 100, RES: 50 }, gameEnergy: 20 },
        targetType: 'LANDMARK',
        targetCount: 1,
      },
      requirements: [{ type: 'LANDMARK_VISITED', count: 1 }],
      unlockConditions: [{ type: 'PREVIOUS_STAGE_COMPLETE' }],
      reward: { realXp: 250, skillXp: { CRE: 100, RES: 50 }, gameEnergy: 20, chainProgress: 80 },
      status: 'LOCKED',
      progress: 0,
    },
    {
      stageId: 'awakening_5',
      chainId: 'awakening',
      order: 5,
      title: 'The Awakened',
      description: 'Complete your awakening by walking 2km of verified distance.',
      questTemplate: {
        category: 'WORLD',
        difficulty: 'NORMAL',
        primarySkill: 'VIT',
        secondarySkills: ['RES', 'WIL'],
        verification: { type: 'GPS_DISTANCE', minimumDistanceMeters: 2000, verificationScoreRequired: 85 },
        baseRewards: { realXp: 500, skillXp: { VIT: 150, RES: 100, WIL: 50 }, gameEnergy: 30 },
        targetType: 'DISTANCE',
        targetCount: 2000,
      },
      requirements: [{ type: 'DISTANCE_WALKED', meters: 2000 }],
      unlockConditions: [{ type: 'PREVIOUS_STAGE_COMPLETE' }],
      reward: { realXp: 500, skillXp: { VIT: 150, RES: 100, WIL: 50 }, gameEnergy: 30, chainProgress: 100, unlocks: ['first_steps'] },
      status: 'LOCKED',
      progress: 0,
    },
  ],
  currentStage: 0,
  status: 'LOCKED',
  totalProgress: 0,
  totalStages: 5,
  rewards: [
    { rewardId: 'awakening_title', type: 'TITLE', value: 'AWAKENED', claimed: false },
    { rewardId: 'awakening_xp', type: 'REAL_XP', value: 1350, claimed: false },
    { rewardId: 'awakening_unlock', type: 'UNLOCK', value: 'first_steps', claimed: false, unlocksChainId: 'first_steps' },
  ],
  claimedRewards: [],
  metadata: {
    isStarter: true,
    difficulty: 'EASY',
    estimatedDurationHours: 4,
    worldContextAffinity: ['UNKNOWN', 'URBAN', 'RESIDENTIAL', 'PARK'],
    repeatable: false,
  },
};

export function createDefaultChainState(): ChainState {
  const state = createChainState();
  return addChain(state, AWAKENING_CHAIN);
}