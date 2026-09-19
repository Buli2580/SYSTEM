// SYSTEM 2.0 — DYNAMIC WORLD QUEST GENERATOR
// Generate quest opportunities from actual world state

import type { GeoPoint } from '../core';
import type { Quest, QuestCategory, QuestDifficulty, QuestStatus, QuestReward, QuestVerification, SkillKey } from '../core/types';
import type { WorldContext } from './context';
import type { SpawnEntry, SpawnType } from './spawn';
import type { SafetyAssessment } from './safety';

export type WorldQuestTemplate =
  | 'DISCOVER_NEW_SECTOR'
  | 'EXPLORE_MULTIPLE_SECTORS'
  | 'VISIT_SAFE_LANDMARK'
  | 'INVESTIGATE_SIGNAL'
  | 'FIND_CACHE'
  | 'INVESTIGATE_ANOMALY'
  | 'VERIFIED_DISTANCE'
  | 'EXPLORE_NEW_AREA'
  | 'WORLD_EVENT_OBJECTIVE';

export type WorldQuestDifficulty = 'EASY' | 'NORMAL' | 'HARD' | 'ELITE';

export interface WorldQuestGenerationInput {
  playerLocation: GeoPoint;
  currentSector: string;
  currentArea?: string;
  currentRegion?: string;
  worldContext: WorldContext;
  discoveredSectors: Set<string>;
  exploredSectors: Set<string>;
  nearbySpawns: SpawnEntry[];
  nearbyLandmarks: Array<{ landmarkId: string; name: string; coordinates: GeoPoint; sectorId: string; state: string }>;
  nearbySafeAreas: Array<{ areaId: string; center: GeoPoint; radiusMeters: number }>;
  safetyAssessment: SafetyAssessment;
  playerLevel: number;
  explorerRank: number;
  activeWorldEvent?: { eventId: string; type: string; intensity: number };
  completedWorldQuests: Set<string>;
  timeBucket: string;
}

export interface GeneratedWorldQuest {
  quest: Quest;
  template: WorldQuestTemplate;
  spawnId?: string;
  priority: number;
  expiresAt: string;
  metadata: WorldQuestMetadata;
}

export interface WorldQuestMetadata {
  expiresAt: string;
  template: WorldQuestTemplate;
  targetSector?: string;
  targetArea?: string;
  targetCoordinates?: GeoPoint;
  requiredSectors?: string[];
  requiredLandmarks?: string[];
  requiredDistance?: number;
  safetyVerified: boolean;
  generatedAt: string;
  context: WorldContext;
}

const QUEST_TEMPLATES: Record<WorldQuestTemplate, {
  title: string;
  description: string;
  category: QuestCategory;
  baseDifficulty: WorldQuestDifficulty;
  primarySkill: SkillKey;
  verification: QuestVerification;
  baseRewards: QuestReward;
  minLevel: number;
  minExplorerRank: number;
  weight: number;
}> = {
  DISCOVER_NEW_SECTOR: {
    title: 'Sector Discovery',
    description: 'Discover a new sector by entering unexplored territory',
    category: 'WORLD',
    baseDifficulty: 'EASY',
    primarySkill: 'RES',
    verification: { type: 'GPS_LOCATION', radiusMeters: 100, verificationScoreRequired: 80 },
    baseRewards: { realXp: 100, skillXp: { RES: 50 }, gameEnergy: 10 },
    minLevel: 1,
    minExplorerRank: 0,
    weight: 100,
  },
  EXPLORE_MULTIPLE_SECTORS: {
    title: 'Multi-Sector Exploration',
    description: 'Explore multiple new sectors in a single expedition',
    category: 'WORLD',
    baseDifficulty: 'NORMAL',
    primarySkill: 'RES',
    verification: { type: 'GPS_DISTANCE', minimumDistanceMeters: 1000, verificationScoreRequired: 85 },
    baseRewards: { realXp: 250, skillXp: { RES: 100, VIT: 50 }, gameEnergy: 20 },
    minLevel: 3,
    minExplorerRank: 1,
    weight: 60,
  },
  VISIT_SAFE_LANDMARK: {
    title: 'Landmark Visit',
    description: 'Visit a discovered landmark in a safe area',
    category: 'WORLD',
    baseDifficulty: 'EASY',
    primarySkill: 'RES',
    verification: { type: 'GPS_LOCATION', radiusMeters: 50, verificationScoreRequired: 90 },
    baseRewards: { realXp: 150, skillXp: { RES: 75 }, gameEnergy: 15 },
    minLevel: 2,
    minExplorerRank: 0,
    weight: 80,
  },
  INVESTIGATE_SIGNAL: {
    title: 'Signal Investigation',
    description: 'Locate and investigate a mysterious world signal',
    category: 'WORLD',
    baseDifficulty: 'NORMAL',
    primarySkill: 'INT',
    verification: { type: 'GPS_LOCATION', radiusMeters: 40, verificationScoreRequired: 95 },
    baseRewards: { realXp: 200, skillXp: { INT: 100, RES: 50 }, gameEnergy: 15 },
    minLevel: 5,
    minExplorerRank: 1,
    weight: 70,
  },
  FIND_CACHE: {
    title: 'Cache Hunter',
    description: 'Find and claim a hidden world cache',
    category: 'WORLD',
    baseDifficulty: 'NORMAL',
    primarySkill: 'CRE',
    verification: { type: 'GPS_LOCATION', radiusMeters: 30, verificationScoreRequired: 90 },
    baseRewards: { realXp: 180, skillXp: { CRE: 80, RES: 40 }, gameEnergy: 15, coins: 50 },
    minLevel: 4,
    minExplorerRank: 1,
    weight: 75,
  },
  INVESTIGATE_ANOMALY: {
    title: 'Anomaly Investigation',
    description: 'Investigate a world anomaly and document its properties',
    category: 'WORLD',
    baseDifficulty: 'HARD',
    primarySkill: 'INT',
    verification: { type: 'MULTI', minimumDistanceMeters: 200, minimumDurationSeconds: 300, verificationScoreRequired: 85 },
    baseRewards: { realXp: 350, skillXp: { INT: 150, RES: 75 }, gameEnergy: 25 },
    minLevel: 8,
    minExplorerRank: 2,
    weight: 50,
  },
  VERIFIED_DISTANCE: {
    title: 'Verified Distance',
    description: 'Complete a verified movement challenge in the world',
    category: 'WORLD',
    baseDifficulty: 'NORMAL',
    primarySkill: 'VIT',
    verification: { type: 'GPS_DISTANCE', minimumDistanceMeters: 2000, verificationScoreRequired: 80 },
    baseRewards: { realXp: 200, skillXp: { VIT: 100, RES: 50 }, gameEnergy: 20 },
    minLevel: 3,
    minExplorerRank: 0,
    weight: 65,
  },
  EXPLORE_NEW_AREA: {
    title: 'Area Exploration',
    description: 'Explore a new area by discovering its sectors',
    category: 'WORLD',
    baseDifficulty: 'HARD',
    primarySkill: 'RES',
    verification: { type: 'GPS_DISTANCE', minimumDistanceMeters: 3000, verificationScoreRequired: 80 },
    baseRewards: { realXp: 500, skillXp: { RES: 200, VIT: 100 }, gameEnergy: 30 },
    minLevel: 10,
    minExplorerRank: 3,
    weight: 40,
  },
  WORLD_EVENT_OBJECTIVE: {
    title: 'World Event Objective',
    description: 'Complete a special objective during an active world event',
    category: 'WORLD',
    baseDifficulty: 'ELITE',
    primarySkill: 'WIL',
    verification: { type: 'MULTI', minimumDistanceMeters: 1000, minimumDurationSeconds: 600, verificationScoreRequired: 90 },
    baseRewards: { realXp: 750, skillXp: { WIL: 200, RES: 100 }, gameEnergy: 50 },
    minLevel: 15,
    minExplorerRank: 4,
    weight: 30,
  },
};

export function generateWorldQuests(input: WorldQuestGenerationInput): GeneratedWorldQuest[] {
  const candidates: Array<{ template: WorldQuestTemplate; weight: number; data: Partial<GeneratedWorldQuest> }> = [];

  for (const [template, config] of Object.entries(QUEST_TEMPLATES)) {
    if (input.playerLevel < config.minLevel) continue;
    if (input.explorerRank < config.minExplorerRank) continue;
    if (input.completedWorldQuests.has(template)) continue;

    const weight = calculateTemplateWeight(template as WorldQuestTemplate, config.weight, input);
    if (weight <= 0) continue;

    const questData = generateQuestFromTemplate(template as WorldQuestTemplate, config, input);
    if (questData) {
      candidates.push({ template: template as WorldQuestTemplate, weight, data: questData });
    }
  }

  candidates.sort((a, b) => b.weight - a.weight);
  return candidates.slice(0, 5).map(c => ({
    quest: c.data.quest!,
    template: c.template,
    spawnId: c.data.spawnId,
    priority: c.weight,
    expiresAt: c.data.expiresAt!,
    metadata: c.data.metadata!,
  }));
}

function calculateTemplateWeight(
  template: WorldQuestTemplate,
  baseWeight: number,
  input: WorldQuestGenerationInput
): number {
  let weight = baseWeight;

  const undiscoveredNearby = Array.from(input.discoveredSectors).filter(s => !input.exploredSectors.has(s)).length;
  const discoveredCount = input.discoveredSectors.size;

  switch (template) {
    case 'DISCOVER_NEW_SECTOR':
      if (undiscoveredNearby === 0) weight *= 0.1;
      else weight *= 1 + Math.min(undiscoveredNearby, 5) * 0.2;
      break;
    case 'EXPLORE_MULTIPLE_SECTORS':
      if (undiscoveredNearby < 2) weight *= 0.1;
      else weight *= 1 + Math.min(undiscoveredNearby, 5) * 0.15;
      break;
    case 'VISIT_SAFE_LANDMARK':
      const safeLandmarks = input.nearbyLandmarks.filter(l =>
        l.state === 'DISCOVERED' || l.state === 'VISITED'
      ).length;
      if (safeLandmarks === 0) weight *= 0.1;
      else weight *= safeLandmarks;
      if (input.safetyAssessment.classification !== 'SAFE_PUBLIC') weight *= 0.5;
      break;
    case 'INVESTIGATE_SIGNAL':
      const signals = input.nearbySpawns.filter(s => s.type === 'QUEST_SIGNAL' && s.state === 'ACTIVE').length;
      if (signals === 0) weight *= 0.1;
      else weight *= signals;
      break;
    case 'FIND_CACHE':
      const caches = input.nearbySpawns.filter(s => s.type === 'CACHE' && (s.state === 'ACTIVE' || s.state === 'DISCOVERED')).length;
      if (caches === 0) weight *= 0.1;
      else weight *= caches;
      break;
    case 'INVESTIGATE_ANOMALY':
      const anomalies = input.nearbySpawns.filter(s => s.type === 'ANOMALY' && s.state === 'ACTIVE').length;
      if (anomalies === 0) weight *= 0.1;
      else weight *= anomalies * 2;
      break;
    case 'VERIFIED_DISTANCE':
      if (discoveredCount < 3) weight *= 0.5;
      break;
    case 'EXPLORE_NEW_AREA':
      if (input.currentArea && input.nearbySafeAreas.length > 0) weight *= 1.5;
      break;
    case 'WORLD_EVENT_OBJECTIVE':
      if (!input.activeWorldEvent) weight = 0;
      else weight *= input.activeWorldEvent.intensity;
      break;
  }

  const contextPrefs = getContextPreferences(input.worldContext);
  if (contextPrefs.preferred.includes(template)) weight *= 1.3;
  if (contextPrefs.avoided.includes(template)) weight *= 0.3;

  return Math.max(0, Math.round(weight));
}

function getContextPreferences(context: WorldContext): { preferred: WorldQuestTemplate[]; avoided: WorldQuestTemplate[] } {
  const prefs: Record<WorldContext, { preferred: WorldQuestTemplate[]; avoided: WorldQuestTemplate[] }> = {
    URBAN: { preferred: ['VISIT_SAFE_LANDMARK', 'INVESTIGATE_SIGNAL', 'FIND_CACHE'], avoided: ['EXPLORE_NEW_AREA'] },
    RESIDENTIAL: { preferred: ['DISCOVER_NEW_SECTOR', 'VERIFIED_DISTANCE', 'VISIT_SAFE_LANDMARK'], avoided: [] },
    COMMERCIAL: { preferred: ['VISIT_SAFE_LANDMARK', 'INVESTIGATE_SIGNAL'], avoided: ['EXPLORE_NEW_AREA'] },
    PARK: { preferred: ['VISIT_SAFE_LANDMARK', 'FIND_CACHE', 'EXPLORE_MULTIPLE_SECTORS'], avoided: [] },
    NATURE: { preferred: ['EXPLORE_MULTIPLE_SECTORS', 'FIND_CACHE', 'INVESTIGATE_ANOMALY'], avoided: ['VISIT_SAFE_LANDMARK'] },
    TRAIL: { preferred: ['VERIFIED_DISTANCE', 'EXPLORE_MULTIPLE_SECTORS', 'FIND_CACHE'], avoided: [] },
    WATERFRONT: { preferred: ['VISIT_SAFE_LANDMARK', 'EXPLORE_MULTIPLE_SECTORS', 'FIND_CACHE'], avoided: [] },
    MIXED: { preferred: ['DISCOVER_NEW_SECTOR', 'VISIT_SAFE_LANDMARK', 'INVESTIGATE_SIGNAL'], avoided: [] },
    UNKNOWN: { preferred: ['DISCOVER_NEW_SECTOR'], avoided: [] },
  };
  return prefs[context] || { preferred: [], avoided: [] };
}

function generateQuestFromTemplate(
  template: WorldQuestTemplate,
  config: typeof QUEST_TEMPLATES[WorldQuestTemplate],
  input: WorldQuestGenerationInput
): { quest: Quest; spawnId?: string; expiresAt: string; metadata: WorldQuestMetadata } | null {
  const now = Date.now();
  const expiresAt = new Date(now + 4 * 60 * 60 * 1000).toISOString();
  const questId = `world_${template.toLowerCase()}_${now}`;

  let targetSector: string | undefined;
  let targetArea: string | undefined;
  let targetCoordinates: GeoPoint | undefined;
  let requiredSectors: string[] | undefined;
  let requiredLandmarks: string[] | undefined;
  let requiredDistance: number | undefined;
  let safetyVerified = true;
  let spawnId: string | undefined;

  switch (template) {
    case 'DISCOVER_NEW_SECTOR': {
      const undiscovered = getNearbyUndiscoveredSectors(input);
      if (undiscovered.length === 0) return null;
      targetSector = undiscovered[0];
      targetCoordinates = getSectorCenter(targetSector);
      break;
    }
    case 'EXPLORE_MULTIPLE_SECTORS': {
      const undiscovered = getNearbyUndiscoveredSectors(input);
      if (undiscovered.length < 2) return null;
      requiredSectors = undiscovered.slice(0, 3);
      targetSector = requiredSectors[0];
      targetCoordinates = getSectorCenter(targetSector);
      break;
    }
    case 'VISIT_SAFE_LANDMARK': {
      const safeLandmarks = input.nearbyLandmarks.filter(l =>
        (l.state === 'DISCOVERED' || l.state === 'VISITED') &&
        input.nearbySafeAreas.some(sa => haversineDistance(l.coordinates, sa.center) <= sa.radiusMeters)
      );
      if (safeLandmarks.length === 0) return null;
      const landmark = safeLandmarks[0];
      targetCoordinates = landmark.coordinates;
      requiredLandmarks = [landmark.landmarkId];
      break;
    }
    case 'INVESTIGATE_SIGNAL': {
      const signal = input.nearbySpawns.find(s => s.type === 'QUEST_SIGNAL' && s.state === 'ACTIVE');
      if (!signal) return null;
      targetCoordinates = signal.coordinates;
      spawnId = signal.spawnId;
      break;
    }
    case 'FIND_CACHE': {
      const cache = input.nearbySpawns.find(s => s.type === 'CACHE' && (s.state === 'ACTIVE' || s.state === 'DISCOVERED'));
      if (!cache) return null;
      targetCoordinates = cache.coordinates;
      spawnId = cache.spawnId;
      break;
    }
    case 'INVESTIGATE_ANOMALY': {
      const anomaly = input.nearbySpawns.find(s => s.type === 'ANOMALY' && s.state === 'ACTIVE');
      if (!anomaly) return null;
      targetCoordinates = anomaly.coordinates;
      spawnId = anomaly.spawnId;
      break;
    }
    case 'VERIFIED_DISTANCE': {
      requiredDistance = 2000 + input.playerLevel * 100;
      targetCoordinates = input.playerLocation;
      break;
    }
    case 'EXPLORE_NEW_AREA': {
      if (!input.currentArea) return null;
      targetArea = input.currentArea;
      targetCoordinates = input.nearbySafeAreas[0]?.center || input.playerLocation;
      break;
    }
    case 'WORLD_EVENT_OBJECTIVE': {
      if (!input.activeWorldEvent) return null;
      targetCoordinates = input.playerLocation;
      break;
    }
  }

  if (targetCoordinates) {
    const safety = input.safetyAssessment;
    if (safety.classification === 'AVOID') safetyVerified = false;
  }

  const difficulty = calculateDifficulty(template, input.playerLevel, input.explorerRank);
  const rewards = scaleRewards(config.baseRewards, difficulty, input.playerLevel);

  const quest: Quest = {
    id: questId,
    title: config.title,
    description: config.description,
    category: config.category,
    difficulty: mapDifficulty(difficulty),
    status: 'AVAILABLE',
    primarySkill: config.primarySkill,
    secondarySkills: getSecondarySkills(template),
    verification: { ...config.verification, targetLocation: targetCoordinates, radiusMeters: config.verification.radiusMeters },
    rewards,
    progress: 0,
    progressTarget: getProgressTarget(template, requiredDistance),
    createdAt: new Date().toISOString(),
    chapter: 0,
    arc: 'WORLD',
    hidden: false,
  };

  return {
    quest,
    spawnId,
    expiresAt,
    metadata: {
      template,
      targetSector,
      targetArea,
      targetCoordinates,
      requiredSectors,
      requiredLandmarks,
      requiredDistance,
      safetyVerified,
      generatedAt: new Date().toISOString(),
      expiresAt,
      context: input.worldContext,
    },
  };
}

function getNearbyUndiscoveredSectors(input: WorldQuestGenerationInput): string[] {
  const { getNearbySectors } = require('./sectors') as typeof import('./sectors');
  const nearby = getNearbySectors(input.currentSector, 6);
  return nearby.filter(s => !input.discoveredSectors.has(s));
}

function getSectorCenter(sectorId: string): GeoPoint {
  const { sectorToBounds } = require('./sectors');
  const [w, s, e, n] = sectorToBounds(sectorId);
  return { latitude: (s + n) / 2, longitude: (w + e) / 2 };
}

function calculateDifficulty(
  template: WorldQuestTemplate,
  playerLevel: number,
  explorerRank: number
): WorldQuestDifficulty {
  const base = QUEST_TEMPLATES[template].baseDifficulty;
  const levelDiff = playerLevel - QUEST_TEMPLATES[template].minLevel;
  const rankDiff = explorerRank - QUEST_TEMPLATES[template].minExplorerRank;

  if (levelDiff >= 10 && rankDiff >= 3) return 'EASY';
  if (levelDiff >= 5 && rankDiff >= 2) return 'NORMAL';
  if (base === 'HARD' || base === 'ELITE') return base;
  if (levelDiff < 0 || rankDiff < 0) return 'HARD';
  return base;
}

function mapDifficulty(d: WorldQuestDifficulty): QuestDifficulty {
  const map: Record<WorldQuestDifficulty, QuestDifficulty> = {
    EASY: 'EASY',
    NORMAL: 'NORMAL',
    HARD: 'HARD',
    ELITE: 'EXTREME',
  };
  return map[d];
}

function scaleRewards(base: QuestReward, difficulty: WorldQuestDifficulty, level: number): QuestReward {
  const multipliers: Record<WorldQuestDifficulty, number> = { EASY: 1.0, NORMAL: 1.5, HARD: 2.0, ELITE: 3.0 };
  const mult = multipliers[difficulty];
  const levelBonus = 1 + level * 0.05;

  return {
    realXp: Math.round(base.realXp * mult * levelBonus),
    skillXp: base.skillXp ? Object.fromEntries(
      Object.entries(base.skillXp).map(([k, v]) => [k, Math.round(v * mult * levelBonus)])
    ) : undefined,
    gameEnergy: Math.round((base.gameEnergy || 0) * mult),
    coins: Math.round((base.coins || 0) * mult),
    chest: base.chest,
  };
}

function getSecondarySkills(template: WorldQuestTemplate): SkillKey[] {
  const skills: Record<WorldQuestTemplate, SkillKey[]> = {
    DISCOVER_NEW_SECTOR: ['VIT'],
    EXPLORE_MULTIPLE_SECTORS: ['VIT', 'INT'],
    VISIT_SAFE_LANDMARK: ['CRE'],
    INVESTIGATE_SIGNAL: ['RES', 'CRE'],
    FIND_CACHE: ['INT', 'RES'],
    INVESTIGATE_ANOMALY: ['RES', 'WIL'],
    VERIFIED_DISTANCE: ['RES', 'STR'],
    EXPLORE_NEW_AREA: ['VIT', 'INT', 'CRE'],
    WORLD_EVENT_OBJECTIVE: ['STR', 'CHA'],
  };
  return skills[template] || [];
}

function getProgressTarget(template: WorldQuestTemplate, requiredDistance?: number): number {
  const targets: Record<WorldQuestTemplate, number> = {
    DISCOVER_NEW_SECTOR: 1,
    EXPLORE_MULTIPLE_SECTORS: 3,
    VISIT_SAFE_LANDMARK: 1,
    INVESTIGATE_SIGNAL: 1,
    FIND_CACHE: 1,
    INVESTIGATE_ANOMALY: 1,
    VERIFIED_DISTANCE: requiredDistance || 2000,
    EXPLORE_NEW_AREA: 5,
    WORLD_EVENT_OBJECTIVE: 1,
  };
  return targets[template] || 1;
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

export function isWorldQuestValid(quest: Quest, metadata: WorldQuestMetadata, currentLocation: GeoPoint): boolean {
  if (!metadata.safetyVerified) return false;
  if (new Date(metadata.expiresAt) < new Date()) return false;
  return true;
}