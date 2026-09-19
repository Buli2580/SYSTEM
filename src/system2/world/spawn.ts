// SYSTEM 2.0 — WORLD SPAWN DIRECTOR
// Deterministic content spawn director

import type { GeoPoint } from '../core';
import type { WorldContext } from './context';

export type SpawnType =
  | 'QUEST_SIGNAL'
  | 'CACHE'
  | 'ANOMALY'
  | 'CHALLENGE'
  | 'BOSS_SIGNAL'
  | 'SPECIAL_DISCOVERY';

export type SpawnState =
  | 'PENDING'
  | 'ACTIVE'
  | 'DISCOVERED'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'REPLACED';

export interface SpawnEntry {
  spawnId: string;
  type: SpawnType;
  state: SpawnState;
  sectorId: string;
  areaId?: string;
  regionId?: string;
  coordinates: GeoPoint;
  priority: number;
  spawnData: SpawnData;
  createdAt: string;
  activatedAt?: string;
  discoveredAt?: string;
  completedAt?: string;
  expiresAt?: string;
  replacedBy?: string;
  deterministicSeed: string;
}

export interface SpawnData {
  questId?: string;
  cacheTier?: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC';
  anomalyType?: 'DISTORTION' | 'ENERGY_SPIKE' | 'UNKNOWN_SIGNAL' | 'TEMPORAL_ECHO';
  challengeType?: string;
  bossId?: string;
  specialDiscoveryId?: string;
  difficulty?: 'EASY' | 'NORMAL' | 'HARD' | 'ELITE';
  rewardRef?: string;
  metadata?: Record<string, unknown>;
}

export interface SpawnDirectorInput {
  sectorId: string;
  areaId?: string;
  regionId?: string;
  playerProgression: PlayerProgression;
  explorationState: ExplorationState;
  timeBucket: TimeBucket;
  worldContext: WorldContext;
  existingSpawns: SpawnEntry[];
  activeWorldEvent?: WorldEvent;
}

export interface PlayerProgression {
  realLevel: number;
  explorerRank: number;
  totalDistanceMeters: number;
  discoveredSectorCount: number;
  completedQuestCount: number;
}

export interface ExplorationState {
  nearbyDiscoveredSectors: number;
  nearbySignals: number;
  nearbyCaches: number;
  nearbyAnomalies: number;
  nearbyBosses: number;
  sectorDiscoveryPercentage: number;
  areaExplorationPercentage: number;
}

export type TimeBucket = 'DAWN' | 'MORNING' | 'NOON' | 'AFTERNOON' | 'EVENING' | 'NIGHT' | 'LATE_NIGHT';

export interface WorldEvent {
  eventId: string;
  type: 'EXPLORATION_SURGE' | 'QUEST_SURGE' | 'ANOMALY_WAVE' | 'CACHE_RUSH' | 'BOSS_ACTIVITY' | 'REGION_EVENT';
  scope: 'SECTOR' | 'AREA' | 'REGION';
  targetIds: string[];
  startTime: string;
  endTime: string;
  intensity: number;
}

export interface SpawnBudget {
  maxSignals: number;
  maxCaches: number;
  maxAnomalies: number;
  maxChallenges: number;
  maxBossSignals: number;
  maxSpecialDiscoveries: number;
  minSpacingMeters: number;
  cooldownMs: Record<SpawnType, number>;
}

export const DEFAULT_SPAWN_BUDGET: SpawnBudget = {
  maxSignals: 3,
  maxCaches: 2,
  maxAnomalies: 1,
  maxChallenges: 2,
  maxBossSignals: 1,
  maxSpecialDiscoveries: 1,
  minSpacingMeters: 200,
  cooldownMs: {
    QUEST_SIGNAL: 30 * 60 * 1000,
    CACHE: 60 * 60 * 1000,
    ANOMALY: 2 * 60 * 60 * 1000,
    CHALLENGE: 45 * 60 * 1000,
    BOSS_SIGNAL: 4 * 60 * 60 * 1000,
    SPECIAL_DISCOVERY: 24 * 60 * 60 * 1000,
  },
};

export function getCurrentTimeBucket(): TimeBucket {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 7) return 'DAWN';
  if (hour >= 7 && hour < 11) return 'MORNING';
  if (hour >= 11 && hour < 13) return 'NOON';
  if (hour >= 13 && hour < 17) return 'AFTERNOON';
  if (hour >= 17 && hour < 21) return 'EVENING';
  if (hour >= 21 && hour < 23) return 'NIGHT';
  return 'LATE_NIGHT';
}

export function generateDeterministicSeed(input: SpawnDirectorInput): string {
  const parts = [
    input.sectorId,
    input.areaId || 'none',
    input.regionId || 'none',
    input.playerProgression.realLevel.toString(),
    input.playerProgression.explorerRank.toString(),
    input.timeBucket,
    input.worldContext,
    input.explorationState.sectorDiscoveryPercentage.toString(),
    Date.now().toString(),
  ];
  return hashString(parts.join('|'));
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export function calculateSpawnWeights(input: SpawnDirectorInput): Record<SpawnType, number> {
  const { playerProgression, explorationState, timeBucket, worldContext, activeWorldEvent } = input;
  const weights: Record<SpawnType, number> = {
    QUEST_SIGNAL: 100,
    CACHE: 80,
    ANOMALY: 40,
    CHALLENGE: 50,
    BOSS_SIGNAL: 10,
    SPECIAL_DISCOVERY: 5,
  };

  const level = playerProgression.realLevel;
  if (level >= 10) { weights.ANOMALY += 20; weights.BOSS_SIGNAL += 10; }
  if (level >= 20) { weights.ANOMALY += 20; weights.BOSS_SIGNAL += 15; weights.SPECIAL_DISCOVERY += 10; }
  if (level >= 30) { weights.BOSS_SIGNAL += 20; weights.SPECIAL_DISCOVERY += 15; }

  const rank = playerProgression.explorerRank;
  if (rank >= 3) { weights.CACHE += 20; weights.QUEST_SIGNAL += 10; }
  if (rank >= 5) { weights.ANOMALY += 15; weights.SPECIAL_DISCOVERY += 10; }

  if (explorationState.sectorDiscoveryPercentage < 30) { weights.QUEST_SIGNAL += 30; }
  else if (explorationState.sectorDiscoveryPercentage > 80) { weights.SPECIAL_DISCOVERY += 20; weights.BOSS_SIGNAL += 15; }

  if (explorationState.nearbySignals >= DEFAULT_SPAWN_BUDGET.maxSignals) weights.QUEST_SIGNAL = 0;
  if (explorationState.nearbyCaches >= DEFAULT_SPAWN_BUDGET.maxCaches) weights.CACHE = 0;
  if (explorationState.nearbyAnomalies >= DEFAULT_SPAWN_BUDGET.maxAnomalies) weights.ANOMALY = 0;
  if (explorationState.nearbyBosses >= DEFAULT_SPAWN_BUDGET.maxBossSignals) weights.BOSS_SIGNAL = 0;

  const timeMultipliers: Record<TimeBucket, Partial<Record<SpawnType, number>>> = {
    DAWN: { ANOMALY: 1.5, SPECIAL_DISCOVERY: 1.3 },
    MORNING: { QUEST_SIGNAL: 1.2, CACHE: 1.1 },
    NOON: { CHALLENGE: 1.2 },
    AFTERNOON: { QUEST_SIGNAL: 1.1, CACHE: 1.2 },
    EVENING: { ANOMALY: 1.3, BOSS_SIGNAL: 1.2 },
    NIGHT: { ANOMALY: 1.5, BOSS_SIGNAL: 1.5, SPECIAL_DISCOVERY: 1.2 },
    LATE_NIGHT: { ANOMALY: 2.0, BOSS_SIGNAL: 1.5 },
  };
  const timeMult = timeMultipliers[timeBucket];
  if (timeMult) {
    for (const [type, mult] of Object.entries(timeMult)) {
      weights[type as SpawnType] *= mult;
    }
  }

  const contextMultipliers: Record<WorldContext, Partial<Record<SpawnType, number>>> = {
    URBAN: { QUEST_SIGNAL: 1.2, CACHE: 1.1, CHALLENGE: 1.1 },
    RESIDENTIAL: { QUEST_SIGNAL: 1.1, CACHE: 1.2 },
    COMMERCIAL: { QUEST_SIGNAL: 1.2, CHALLENGE: 1.1 },
    PARK: { CACHE: 1.3, ANOMALY: 1.2, SPECIAL_DISCOVERY: 1.2 },
    NATURE: { ANOMALY: 1.5, CACHE: 1.2, SPECIAL_DISCOVERY: 1.3 },
    TRAIL: { ANOMALY: 1.3, CACHE: 1.2, CHALLENGE: 1.2 },
    WATERFRONT: { CACHE: 1.2, SPECIAL_DISCOVERY: 1.2, ANOMALY: 1.1 },
    MIXED: { QUEST_SIGNAL: 1.1, CACHE: 1.1, ANOMALY: 1.1 },
    UNKNOWN: {},
  };
  const contextMult = contextMultipliers[worldContext];
  if (contextMult) {
    for (const [type, mult] of Object.entries(contextMult)) {
      weights[type as SpawnType] *= mult;
    }
  }

  if (activeWorldEvent) {
    const eventMultipliers: Record<WorldEvent['type'], Partial<Record<SpawnType, number>>> = {
      EXPLORATION_SURGE: { QUEST_SIGNAL: 2.0, CACHE: 1.5 },
      QUEST_SURGE: { QUEST_SIGNAL: 2.5, CHALLENGE: 1.5 },
      ANOMALY_WAVE: { ANOMALY: 3.0, SPECIAL_DISCOVERY: 2.0 },
      CACHE_RUSH: { CACHE: 3.0, QUEST_SIGNAL: 1.2 },
      BOSS_ACTIVITY: { BOSS_SIGNAL: 5.0, ANOMALY: 1.5 },
      REGION_EVENT: { SPECIAL_DISCOVERY: 2.0, BOSS_SIGNAL: 2.0, ANOMALY: 1.5 },
    };
    const eventMult = eventMultipliers[activeWorldEvent.type];
    if (eventMult) {
      for (const [type, mult] of Object.entries(eventMult)) {
        weights[type as SpawnType] *= mult;
      }
    }
  }

  for (const key of Object.keys(weights) as SpawnType[]) {
    weights[key] = Math.max(0, Math.round(weights[key]));
  }

  return weights;
}

export function selectSpawnType(weights: Record<SpawnType, number>, seed: string): SpawnType | null {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  if (total === 0) return null;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash;
  }
  const random = (Math.abs(hash) % total) + 1;
  let cumulative = 0;
  for (const [type, weight] of Object.entries(weights)) {
    cumulative += weight;
    if (random <= cumulative) return type as SpawnType;
  }
  return Object.keys(weights)[0] as SpawnType;
}

export function generateSpawnCoordinates(
  sectorId: string,
  existingSpawns: SpawnEntry[],
  budget: SpawnBudget,
  seed: string
): GeoPoint | null {
  const { sectorToBounds } = require('./sectors');
  const bounds = sectorToBounds(sectorId);
  const [w, s, e, n] = bounds;
  const centerLat = (s + n) / 2;
  const centerLon = (w + e) / 2;

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash;
  }

  const attempts = 10;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const angle = ((hash + attempt * 137) % 360) * Math.PI / 180;
    const distance = (Math.abs(hash + attempt * 47) % 80 + 20) * 10;
    const lat = centerLat + (distance / 111000) * Math.cos(angle);
    const lon = centerLon + (distance / (111000 * Math.cos(centerLat * Math.PI / 180))) * Math.sin(angle);
    const candidate: GeoPoint = { latitude: lat, longitude: lon };

    let tooClose = false;
    for (const existing of existingSpawns) {
      if (haversineDistance(candidate, existing.coordinates) < budget.minSpacingMeters) {
        tooClose = true;
        break;
      }
    }
    if (!tooClose) return candidate;
  }

  return { latitude: centerLat, longitude: centerLon };
}

export function createSpawnEntry(
  input: SpawnDirectorInput,
  type: SpawnType,
  coordinates: GeoPoint,
  seed: string,
  budget: SpawnBudget
): SpawnEntry {
  const now = new Date().toISOString();
  const spawnData = generateSpawnData(type, input, seed);
  const expiresAt = new Date(Date.now() + budget.cooldownMs[type] * 4).toISOString();
  return {
    spawnId: `spawn_${type.toLowerCase()}_${Date.now()}_${seed.slice(0, 8)}`,
    type,
    state: 'PENDING',
    sectorId: input.sectorId,
    areaId: input.areaId,
    regionId: input.regionId,
    coordinates,
    priority: calculateSpawnPriority(type, input),
    spawnData,
    createdAt: now,
    expiresAt,
    deterministicSeed: seed,
  };
}

function generateSpawnData(type: SpawnType, input: SpawnDirectorInput, seed: string): SpawnData {
  const difficulty = calculateDifficulty(input.playerProgression.realLevel);
  const baseData: SpawnData = { difficulty, metadata: { seed } };
  switch (type) {
    case 'QUEST_SIGNAL':
      return { ...baseData, questId: `world_quest_${seed.slice(0, 8)}`, metadata: { ...baseData.metadata, context: input.worldContext } };
    case 'CACHE':
      return { ...baseData, cacheTier: selectCacheTier(input.playerProgression.explorerRank) };
    case 'ANOMALY':
      return { ...baseData, anomalyType: selectAnomalyType(seed) };
    case 'CHALLENGE':
      return { ...baseData, challengeType: selectChallengeType(input.worldContext) };
    case 'BOSS_SIGNAL':
      return { ...baseData, bossId: `boss_${seed.slice(0, 8)}` };
    case 'SPECIAL_DISCOVERY':
      return { ...baseData, specialDiscoveryId: `special_${seed.slice(0, 8)}` };
  }
}

function calculateDifficulty(level: number): 'EASY' | 'NORMAL' | 'HARD' | 'ELITE' {
  if (level < 5) return 'EASY';
  if (level < 15) return 'NORMAL';
  if (level < 30) return 'HARD';
  return 'ELITE';
}

function selectCacheTier(rank: number): 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' {
  if (rank < 2) return 'COMMON';
  if (rank < 4) return 'UNCOMMON';
  if (rank < 6) return 'RARE';
  return 'EPIC';
}

function selectAnomalyType(seed: string): 'DISTORTION' | 'ENERGY_SPIKE' | 'UNKNOWN_SIGNAL' | 'TEMPORAL_ECHO' {
  const types: Array<'DISTORTION' | 'ENERGY_SPIKE' | 'UNKNOWN_SIGNAL' | 'TEMPORAL_ECHO'> =
    ['DISTORTION', 'ENERGY_SPIKE', 'UNKNOWN_SIGNAL', 'TEMPORAL_ECHO'];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash) + seed.charCodeAt(i);
  return types[Math.abs(hash) % types.length];
}

function selectChallengeType(context: WorldContext): string {
  const challenges: Record<WorldContext, string[]> = {
    URBAN: ['URBAN_NAVIGATION', 'LANDMARK_HUNT', 'SIGNAL_TRACE'],
    RESIDENTIAL: ['NEIGHBORHOOD_WALK', 'SECTOR_DISCOVERY', 'DISTANCE_WALK'],
    COMMERCIAL: ['COMMERCIAL_EXPLORE', 'LANDMARK_VISIT', 'SIGNAL_INVESTIGATE'],
    PARK: ['PARK_EXPLORATION', 'CACHE_HUNT', 'TRAIL_WALK'],
    NATURE: ['WILDERNESS_TREK', 'ANOMALY_INVESTIGATE', 'CACHE_SEEK'],
    TRAIL: ['TRAIL_BLAZING', 'DISTANCE_CHALLENGE', 'VIEWPOINT_REACH'],
    WATERFRONT: ['WATERFRONT_WALK', 'LANDMARK_VISIT', 'CACHE_HUNT'],
    MIXED: ['MIXED_EXPLORATION', 'SECTOR_DISCOVERY', 'SIGNAL_TRACE'],
    UNKNOWN: ['SECTOR_DISCOVERY', 'EXPLORE_UNKNOWN'],
  };
  const list = challenges[context] || challenges.UNKNOWN;
  return list[0];
}

function calculateSpawnPriority(type: SpawnType, input: SpawnDirectorInput): number {
  const basePriorities: Record<SpawnType, number> = {
    QUEST_SIGNAL: 100,
    CACHE: 80,
    ANOMALY: 90,
    CHALLENGE: 70,
    BOSS_SIGNAL: 200,
    SPECIAL_DISCOVERY: 150,
  };
  return basePriorities[type] + input.playerProgression.realLevel;
}

export function shouldRespawn(existing: SpawnEntry, budget: SpawnBudget): boolean {
  if (existing.state === 'ACTIVE' || existing.state === 'DISCOVERED') return false;
  if (existing.expiresAt && new Date(existing.expiresAt) < new Date()) return true;
  return false;
}

export function findReplacementSpawn(existingSpawns: SpawnEntry[], budget: SpawnBudget): SpawnEntry | null {
  const expired = existingSpawns.filter(s => shouldRespawn(s, budget));
  if (expired.length === 0) return null;
  return expired.sort((a, b) => (a.expiresAt || '').localeCompare(b.expiresAt || ''))[0] || null;
}

function haversineDistance(a: GeoPoint, b: GeoPoint): number {
  const R = 6371000;
  const lat1 = a.latitude * Math.PI / 180;
  const lat2 = b.latitude * Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * Math.PI / 180;
  const dLon = (b.longitude - a.longitude) * Math.PI / 180;
  const a2 = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a2), Math.sqrt(1 - a2));
  return R * c;
}