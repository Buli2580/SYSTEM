// SYSTEM 2.0 — WORLD DENSITY / SPAWN BUDGET
// Map-content density control

import type { SpawnType, SpawnBudget, SpawnEntry } from './spawn';
import type { WorldContext } from './context';

export interface DensityConfig {
  maxSignalsPerSector: number;
  maxCachesPerSector: number;
  maxAnomaliesPerSector: number;
  maxChallengesPerSector: number;
  maxBossSignalsPerArea: number;
  maxSpecialDiscoveriesPerRegion: number;
  globalMaxActiveSpawns: number;
  minSpacingMeters: number;
  cooldownMs: Record<SpawnType, number>;
  expirationRules: ExpirationRules;
  replacementRules: ReplacementRules;
  contextDensityModifiers: Record<WorldContext, Partial<Record<SpawnType, number>>>;
  progressionDensityScaling: ProgressionScaling;
}

export interface ExpirationRules {
  signalMaxAgeMs: number;
  cacheMaxAgeMs: number;
  anomalyMaxAgeMs: number;
  challengeMaxAgeMs: number;
  bossSignalMaxAgeMs: number;
  specialDiscoveryMaxAgeMs: number;
  inactiveCleanupMs: number;
}

export interface ReplacementRules {
  allowReplacement: boolean;
  replacementPriority: SpawnType[];
  maxReplacementsPerHour: number;
  replacementCooldownMs: number;
}

export interface ProgressionScaling {
  levelThresholds: number[];
  densityMultipliers: number[];
  explorerRankThresholds: number[];
  rankDensityMultipliers: number[];
}

export const DEFAULT_DENSITY_CONFIG: DensityConfig = {
  maxSignalsPerSector: 3,
  maxCachesPerSector: 2,
  maxAnomaliesPerSector: 1,
  maxChallengesPerSector: 2,
  maxBossSignalsPerArea: 1,
  maxSpecialDiscoveriesPerRegion: 1,
  globalMaxActiveSpawns: 50,
  minSpacingMeters: 200,
  cooldownMs: {
    QUEST_SIGNAL: 30 * 60 * 1000,
    CACHE: 60 * 60 * 1000,
    ANOMALY: 2 * 60 * 60 * 1000,
    CHALLENGE: 45 * 60 * 1000,
    BOSS_SIGNAL: 4 * 60 * 60 * 1000,
    SPECIAL_DISCOVERY: 24 * 60 * 60 * 1000,
  },
  expirationRules: {
    signalMaxAgeMs: 4 * 60 * 60 * 1000,
    cacheMaxAgeMs: 24 * 60 * 60 * 1000,
    anomalyMaxAgeMs: 6 * 60 * 60 * 1000,
    challengeMaxAgeMs: 2 * 60 * 60 * 1000,
    bossSignalMaxAgeMs: 12 * 60 * 60 * 1000,
    specialDiscoveryMaxAgeMs: 7 * 24 * 60 * 60 * 1000,
    inactiveCleanupMs: 60 * 60 * 1000,
  },
  replacementRules: {
    allowReplacement: true,
    replacementPriority: ['QUEST_SIGNAL', 'CACHE', 'ANOMALY', 'CHALLENGE', 'BOSS_SIGNAL', 'SPECIAL_DISCOVERY'],
    maxReplacementsPerHour: 3,
    replacementCooldownMs: 10 * 60 * 1000,
  },
  contextDensityModifiers: {
    URBAN: { QUEST_SIGNAL: 1.2, CACHE: 1.1, CHALLENGE: 1.1 },
    RESIDENTIAL: { QUEST_SIGNAL: 1.1, CACHE: 1.2 },
    COMMERCIAL: { QUEST_SIGNAL: 1.2, CHALLENGE: 1.1 },
    PARK: { CACHE: 1.3, ANOMALY: 1.2, SPECIAL_DISCOVERY: 1.2 },
    NATURE: { ANOMALY: 1.5, CACHE: 1.2, SPECIAL_DISCOVERY: 1.3 },
    TRAIL: { ANOMALY: 1.3, CACHE: 1.2, CHALLENGE: 1.2 },
    WATERFRONT: { CACHE: 1.2, SPECIAL_DISCOVERY: 1.2, ANOMALY: 1.1 },
    MIXED: { QUEST_SIGNAL: 1.1, CACHE: 1.1, ANOMALY: 1.1 },
    UNKNOWN: {},
  },
  progressionDensityScaling: {
    levelThresholds: [10, 20, 30, 40, 50],
    densityMultipliers: [1.0, 1.2, 1.4, 1.6, 1.8, 2.0],
    explorerRankThresholds: [2, 4, 6, 8],
    rankDensityMultipliers: [1.0, 1.15, 1.3, 1.5, 1.7],
  },
};

export interface DensityState {
  activeSpawnsBySector: Map<string, SpawnEntry[]>;
  activeSpawnsByArea: Map<string, SpawnEntry[]>;
  activeSpawnsByRegion: Map<string, SpawnEntry[]>;
  globalActiveCount: number;
  recentReplacements: number;
  lastCleanupAt: string;
}

export function createDensityState(): DensityState {
  return {
    activeSpawnsBySector: new Map(),
    activeSpawnsByArea: new Map(),
    activeSpawnsByRegion: new Map(),
    globalActiveCount: 0,
    recentReplacements: 0,
    lastCleanupAt: new Date().toISOString(),
  };
}

export function getEffectiveBudget(config: DensityConfig, context: WorldContext, playerLevel: number, explorerRank: number): SpawnBudget {
  let levelMultiplier = 1.0;
  for (let i = 0; i < config.progressionDensityScaling.levelThresholds.length; i++) {
    if (playerLevel >= config.progressionDensityScaling.levelThresholds[i]) {
      levelMultiplier = config.progressionDensityScaling.densityMultipliers[i + 1];
    } else {
      break;
    }
  }

  let rankMultiplier = 1.0;
  for (let i = 0; i < config.progressionDensityScaling.explorerRankThresholds.length; i++) {
    if (explorerRank >= config.progressionDensityScaling.explorerRankThresholds[i]) {
      rankMultiplier = config.progressionDensityScaling.rankDensityMultipliers[i + 1];
    } else {
      break;
    }
  }

  const combinedMultiplier = levelMultiplier * rankMultiplier;
  const contextMod = config.contextDensityModifiers[context] || {};

  return {
    maxSignals: Math.round(config.maxSignalsPerSector * combinedMultiplier * (contextMod.QUEST_SIGNAL || 1)),
    maxCaches: Math.round(config.maxCachesPerSector * combinedMultiplier * (contextMod.CACHE || 1)),
    maxAnomalies: Math.round(config.maxAnomaliesPerSector * combinedMultiplier * (contextMod.ANOMALY || 1)),
    maxChallenges: Math.round(config.maxChallengesPerSector * combinedMultiplier * (contextMod.CHALLENGE || 1)),
    maxBossSignals: Math.round(config.maxBossSignalsPerArea * combinedMultiplier * (contextMod.BOSS_SIGNAL || 1)),
    maxSpecialDiscoveries: Math.round(config.maxSpecialDiscoveriesPerRegion * combinedMultiplier * (contextMod.SPECIAL_DISCOVERY || 1)),
    minSpacingMeters: config.minSpacingMeters,
    cooldownMs: { ...config.cooldownMs },
  };
}

export function canSpawnInSector(
  state: DensityState,
  sectorId: string,
  type: SpawnType,
  effectiveBudget: SpawnBudget
): { allowed: boolean; reason?: string } {
  const sectorSpawns = state.activeSpawnsBySector.get(sectorId) || [];
  const activeOfType = sectorSpawns.filter(s => s.type === type && (s.state === 'PENDING' || s.state === 'ACTIVE')).length;

  let maxAllowed: number;
  switch (type) {
    case 'QUEST_SIGNAL': maxAllowed = effectiveBudget.maxSignals; break;
    case 'CACHE': maxAllowed = effectiveBudget.maxCaches; break;
    case 'ANOMALY': maxAllowed = effectiveBudget.maxAnomalies; break;
    case 'CHALLENGE': maxAllowed = effectiveBudget.maxChallenges; break;
    case 'BOSS_SIGNAL': maxAllowed = effectiveBudget.maxBossSignals; break;
    case 'SPECIAL_DISCOVERY': maxAllowed = effectiveBudget.maxSpecialDiscoveries; break;
    default: maxAllowed = 0;
  }

  if (activeOfType >= maxAllowed) {
    return { allowed: false, reason: `Sector already has ${activeOfType}/${maxAllowed} ${type} spawns` };
  }

  if (state.globalActiveCount >= effectiveBudget.maxSignals + effectiveBudget.maxCaches + effectiveBudget.maxAnomalies + effectiveBudget.maxChallenges + effectiveBudget.maxBossSignals + effectiveBudget.maxSpecialDiscoveries) {
    return { allowed: false, reason: 'Global spawn limit reached' };
  }

  return { allowed: true };
}

export function canSpawnInArea(
  state: DensityState,
  areaId: string,
  type: SpawnType,
  effectiveBudget: SpawnBudget
): { allowed: boolean; reason?: string } {
  if (type !== 'BOSS_SIGNAL') return { allowed: true };
  const areaSpawns = state.activeSpawnsByArea.get(areaId) || [];
  const activeBosses = areaSpawns.filter(s => s.type === 'BOSS_SIGNAL' && (s.state === 'PENDING' || s.state === 'ACTIVE')).length;
  if (activeBosses >= effectiveBudget.maxBossSignals) {
    return { allowed: false, reason: `Area already has ${activeBosses}/${effectiveBudget.maxBossSignals} boss signals` };
  }
  return { allowed: true };
}

export function canSpawnInRegion(
  state: DensityState,
  regionId: string,
  type: SpawnType,
  effectiveBudget: SpawnBudget
): { allowed: boolean; reason?: string } {
  if (type !== 'SPECIAL_DISCOVERY') return { allowed: true };
  const regionSpawns = state.activeSpawnsByRegion.get(regionId) || [];
  const activeSpecial = regionSpawns.filter(s => s.type === 'SPECIAL_DISCOVERY' && (s.state === 'PENDING' || s.state === 'ACTIVE')).length;
  if (activeSpecial >= effectiveBudget.maxSpecialDiscoveries) {
    return { allowed: false, reason: `Region already has ${activeSpecial}/${effectiveBudget.maxSpecialDiscoveries} special discoveries` };
  }
  return { allowed: true };
}

export function registerSpawn(state: DensityState, spawn: SpawnEntry): DensityState {
  const newState = { ...state };
  const sectorSpawns = [...(newState.activeSpawnsBySector.get(spawn.sectorId) || []), spawn];
  newState.activeSpawnsBySector.set(spawn.sectorId, sectorSpawns);

  if (spawn.areaId) {
    const areaSpawns = [...(newState.activeSpawnsByArea.get(spawn.areaId) || []), spawn];
    newState.activeSpawnsByArea.set(spawn.areaId, areaSpawns);
  }

  if (spawn.regionId) {
    const regionSpawns = [...(newState.activeSpawnsByRegion.get(spawn.regionId) || []), spawn];
    newState.activeSpawnsByRegion.set(spawn.regionId, regionSpawns);
  }

  newState.globalActiveCount += 1;
  return newState;
}

export function unregisterSpawn(state: DensityState, spawn: SpawnEntry): DensityState {
  const newState = { ...state };
  const sectorSpawns = (newState.activeSpawnsBySector.get(spawn.sectorId) || []).filter(s => s.spawnId !== spawn.spawnId);
  newState.activeSpawnsBySector.set(spawn.sectorId, sectorSpawns);

  if (spawn.areaId) {
    const areaSpawns = (newState.activeSpawnsByArea.get(spawn.areaId) || []).filter(s => s.spawnId !== spawn.spawnId);
    newState.activeSpawnsByArea.set(spawn.areaId, areaSpawns);
  }

  if (spawn.regionId) {
    const regionSpawns = (newState.activeSpawnsByRegion.get(spawn.regionId) || []).filter(s => s.spawnId !== spawn.spawnId);
    newState.activeSpawnsByRegion.set(spawn.regionId, regionSpawns);
  }

  newState.globalActiveCount = Math.max(0, newState.globalActiveCount - 1);
  return newState;
}

export function updateSpawnState(state: DensityState, spawn: SpawnEntry): DensityState {
  const newState = { ...state };
  const sectorSpawns = newState.activeSpawnsBySector.get(spawn.sectorId) || [];
  const index = sectorSpawns.findIndex(s => s.spawnId === spawn.spawnId);
  if (index >= 0) {
    sectorSpawns[index] = spawn;
    newState.activeSpawnsBySector.set(spawn.sectorId, sectorSpawns);
  }
  if (spawn.areaId) {
    const areaSpawns = newState.activeSpawnsByArea.get(spawn.areaId) || [];
    const areaIndex = areaSpawns.findIndex(s => s.spawnId === spawn.spawnId);
    if (areaIndex >= 0) {
      areaSpawns[areaIndex] = spawn;
      newState.activeSpawnsByArea.set(spawn.areaId, areaSpawns);
    }
  }
  if (spawn.regionId) {
    const regionSpawns = newState.activeSpawnsByRegion.get(spawn.regionId) || [];
    const regionIndex = regionSpawns.findIndex(s => s.spawnId === spawn.spawnId);
    if (regionIndex >= 0) {
      regionSpawns[regionIndex] = spawn;
      newState.activeSpawnsByRegion.set(spawn.regionId, regionSpawns);
    }
  }
  return newState;
}

export function cleanupExpiredSpawns(
  state: DensityState,
  config: DensityConfig,
  now: number = Date.now()
): { state: DensityState; cleaned: SpawnEntry[] } {
  const cleaned: SpawnEntry[] = [];
  const newState = { ...state };
  const expirationMs: Record<SpawnType, number> = {
    QUEST_SIGNAL: config.expirationRules.signalMaxAgeMs,
    CACHE: config.expirationRules.cacheMaxAgeMs,
    ANOMALY: config.expirationRules.anomalyMaxAgeMs,
    CHALLENGE: config.expirationRules.challengeMaxAgeMs,
    BOSS_SIGNAL: config.expirationRules.bossSignalMaxAgeMs,
    SPECIAL_DISCOVERY: config.expirationRules.specialDiscoveryMaxAgeMs,
  };

  for (const [sectorId, spawns] of newState.activeSpawnsBySector.entries()) {
    const active: SpawnEntry[] = [];
    for (const spawn of spawns) {
      const maxAge = expirationMs[spawn.type] || config.expirationRules.inactiveCleanupMs;
      const age = now - new Date(spawn.createdAt).getTime();
      if (age > maxAge || (spawn.expiresAt && new Date(spawn.expiresAt).getTime() < now)) {
        spawn.state = 'EXPIRED';
        cleaned.push(spawn);
        newState.globalActiveCount = Math.max(0, newState.globalActiveCount - 1);
      } else {
        active.push(spawn);
      }
    }
    newState.activeSpawnsBySector.set(sectorId, active);
  }

  for (const [areaId, spawns] of newState.activeSpawnsByArea.entries()) {
    newState.activeSpawnsByArea.set(areaId, spawns.filter(s => s.state !== 'EXPIRED'));
  }
  for (const [regionId, spawns] of newState.activeSpawnsByRegion.entries()) {
    newState.activeSpawnsByRegion.set(regionId, spawns.filter(s => s.state !== 'EXPIRED'));
  }

  newState.lastCleanupAt = new Date().toISOString();
  return { state: newState, cleaned };
}

export function tryReplaceSpawn(
  state: DensityState,
  config: DensityConfig,
  newSpawn: SpawnEntry,
  effectiveBudget: SpawnBudget
): { state: DensityState; replaced: SpawnEntry | null } {
  if (!config.replacementRules.allowReplacement) return { state, replaced: null };
  if (state.recentReplacements >= config.replacementRules.maxReplacementsPerHour) return { state, replaced: null };

  const priorityOrder = config.replacementRules.replacementPriority;
  const newTypePriority = priorityOrder.indexOf(newSpawn.type);

  for (const sectorSpawns of state.activeSpawnsBySector.values()) {
    for (const existing of sectorSpawns) {
      if (existing.state === 'EXPIRED' || existing.state === 'COMPLETED') continue;
      const existingPriority = priorityOrder.indexOf(existing.type);
      if (existingPriority > newTypePriority || (existingPriority === newTypePriority && existing.priority < newSpawn.priority)) {
        const updatedState = unregisterSpawn(state, existing);
        const finalState = registerSpawn(updatedState, newSpawn);
        finalState.recentReplacements += 1;
        return { state: finalState, replaced: existing };
      }
    }
  }

  return { state, replaced: null };
}

export function getDensityReport(state: DensityState, config: DensityConfig): {
  globalActive: number;
  globalLimit: number;
  sectorCounts: Map<string, { total: number; byType: Record<SpawnType, number> }>;
  nearLimitSectors: string[];
} {
  const sectorCounts = new Map<string, { total: number; byType: Record<SpawnType, number> }>();
  const nearLimitSectors: string[] = [];

  for (const [sectorId, spawns] of state.activeSpawnsBySector.entries()) {
    const byType: Record<SpawnType, number> = {
      QUEST_SIGNAL: 0,
      CACHE: 0,
      ANOMALY: 0,
      CHALLENGE: 0,
      BOSS_SIGNAL: 0,
      SPECIAL_DISCOVERY: 0,
    };
    for (const spawn of spawns) {
      if (spawn.state === 'PENDING' || spawn.state === 'ACTIVE') {
        byType[spawn.type]++;
      }
    }
    const total = Object.values(byType).reduce((a, b) => a + b, 0);
    sectorCounts.set(sectorId, { total, byType });
    if (total >= config.maxSignalsPerSector + config.maxCachesPerSector + config.maxAnomaliesPerSector + config.maxChallengesPerSector) {
      nearLimitSectors.push(sectorId);
    }
  }

  return {
    globalActive: state.globalActiveCount,
    globalLimit: config.globalMaxActiveSpawns,
    sectorCounts,
    nearLimitSectors,
  };
}