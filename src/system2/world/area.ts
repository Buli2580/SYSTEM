// SYSTEM 2.0 — AREA / DISTRICT SYSTEM
// Hierarchy above sectors: SECTOR → AREA → REGION

import type { GeoPoint } from '../core';

export type AreaLevel = 'SECTOR' | 'AREA' | 'REGION';

export interface WorldArea {
  areaId: string;
  level: 'AREA' | 'REGION';
  name: string;
  displayName: string;
  parentId?: string; // Region ID for Area, undefined for Region
  sectorIds: string[]; // Sectors belonging to this area
  childAreaIds?: string[]; // Areas belonging to this region
  center: GeoPoint;
  bounds: [number, number, number, number]; // [west, south, east, north]
  discoveredSectorCount: number;
  totalSectorCount: number;
  discoveryPercentage: number;
  explorationPercentage: number;
  landmarkCount: number;
  signalCount: number;
  anomalyCount: number;
  cacheCount: number;
  bossEncounterCount: number;
  worldActivityScore: number;
  completionState: AreaCompletionState;
  discoveredAt?: string;
  completedAt?: string;
  masteredAt?: string;
  metadata: AreaMetadata;
  createdAt: string;
  updatedAt: string;
}

export type AreaCompletionState =
  | 'UNDISCOVERED'
  | 'DISCOVERED'
  | 'EXPLORING'
  | 'COMPLETED'
  | 'MASTERED';

export interface AreaMetadata {
  biome?: string;
  populationDensity?: 'URBAN' | 'SUBURBAN' | 'RURAL' | 'WILDERNESS';
  dominantCategories?: string[];
  notableFeatures?: string[];
  safetyRating?: 'SAFE' | 'CAUTION' | 'DANGEROUS';
  culturalSignificance?: string;
}

export interface AreaSectorIndex {
  areaId: string;
  sectorIds: string[];
}

export interface RegionAreaIndex {
  regionId: string;
  areaIds: string[];
}

export function createArea(
  name: string,
  displayName: string,
  sectorIds: string[],
  center: GeoPoint,
  bounds: [number, number, number, number],
  parentId?: string
): WorldArea {
  const now = new Date().toISOString();
  const level = parentId ? 'AREA' : 'REGION';
  return {
    areaId: `area_${level.toLowerCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    level,
    name: name.toLowerCase().replace(/\s+/g, '_'),
    displayName,
    parentId,
    sectorIds: [...sectorIds],
    childAreaIds: [],
    center,
    bounds,
    discoveredSectorCount: 0,
    totalSectorCount: sectorIds.length,
    discoveryPercentage: 0,
    explorationPercentage: 0,
    landmarkCount: 0,
    signalCount: 0,
    anomalyCount: 0,
    cacheCount: 0,
    bossEncounterCount: 0,
    worldActivityScore: 0,
    completionState: 'UNDISCOVERED',
    metadata: {},
    createdAt: now,
    updatedAt: now,
  };
}

export function createRegion(
  name: string,
  displayName: string,
  areaIds: string[],
  center: GeoPoint,
  bounds: [number, number, number, number]
): WorldArea {
  const now = new Date().toISOString();
  return {
    areaId: `area_region_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    level: 'REGION',
    name: name.toLowerCase().replace(/\s+/g, '_'),
    displayName,
    sectorIds: [],
    childAreaIds: [...areaIds],
    center,
    bounds,
    discoveredSectorCount: 0,
    totalSectorCount: 0,
    discoveryPercentage: 0,
    explorationPercentage: 0,
    landmarkCount: 0,
    signalCount: 0,
    anomalyCount: 0,
    cacheCount: 0,
    bossEncounterCount: 0,
    worldActivityScore: 0,
    completionState: 'UNDISCOVERED',
    metadata: {},
    createdAt: now,
    updatedAt: now,
  };
}

export function updateAreaDiscovery(area: WorldArea, discoveredSectorIds: Set<string>): WorldArea {
  const discoveredCount = area.sectorIds.filter(id => discoveredSectorIds.has(id)).length;
  const discoveryPercentage = area.totalSectorCount > 0 ? Math.round((discoveredCount / area.totalSectorCount) * 100) : 0;
  let completionState = area.completionState;
  if (discoveredCount === 0) completionState = 'UNDISCOVERED';
  else if (discoveryPercentage < 100) completionState = 'DISCOVERED';
  else if (area.explorationPercentage < 100) completionState = 'EXPLORING';
  else completionState = 'COMPLETED';
  const discoveredAt = discoveredCount > 0 && !area.discoveredAt ? new Date().toISOString() : area.discoveredAt;
  const completedAt = completionState === 'COMPLETED' && !area.completedAt ? new Date().toISOString() : area.completedAt;
  return {
    ...area,
    discoveredSectorCount: discoveredCount,
    discoveryPercentage,
    completionState,
    discoveredAt,
    completedAt,
    updatedAt: new Date().toISOString(),
  };
}

export function updateAreaExploration(area: WorldArea, exploredSectorIds: Set<string>): WorldArea {
  const exploredCount = area.sectorIds.filter(id => exploredSectorIds.has(id)).length;
  const explorationPercentage = area.totalSectorCount > 0 ? Math.round((exploredCount / area.totalSectorCount) * 100) : 0;
  let completionState = area.completionState;
  if (explorationPercentage === 100 && area.discoveryPercentage === 100) {
    completionState = area.completionState === 'MASTERED' ? 'MASTERED' : 'COMPLETED';
  }
  const completedAt = completionState === 'COMPLETED' && !area.completedAt ? new Date().toISOString() : area.completedAt;
  return {
    ...area,
    explorationPercentage,
    completionState,
    completedAt,
    updatedAt: new Date().toISOString(),
  };
}

export function updateAreaCounts(area: WorldArea, counts: Partial<{
  landmarkCount: number;
  signalCount: number;
  anomalyCount: number;
  cacheCount: number;
  bossEncounterCount: number;
}>): WorldArea {
  return {
    ...area,
    ...counts,
    updatedAt: new Date().toISOString(),
  };
}

export function calculateWorldActivityScore(area: WorldArea): number {
  const weights = {
    landmark: 10,
    signal: 5,
    anomaly: 15,
    cache: 8,
    boss: 50,
  };
  return (
    area.landmarkCount * weights.landmark +
    area.signalCount * weights.signal +
    area.anomalyCount * weights.anomaly +
    area.cacheCount * weights.cache +
    area.bossEncounterCount * weights.boss
  );
}

export function masterArea(area: WorldArea): WorldArea {
  if (area.completionState === 'MASTERED') return area;
  return {
    ...area,
    completionState: 'MASTERED',
    masteredAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function getAreaProgress(area: WorldArea): { discovery: number; exploration: number; overall: number } {
  return {
    discovery: area.discoveryPercentage,
    exploration: area.explorationPercentage,
    overall: Math.round((area.discoveryPercentage + area.explorationPercentage) / 2),
  };
}

export function getAreasByRegion(areas: WorldArea[], regionId: string): WorldArea[] {
  return areas.filter(a => a.parentId === regionId);
}

export function getAreasContainingSector(areas: WorldArea[], sectorId: string): WorldArea[] {
  return areas.filter(a => a.sectorIds.includes(sectorId));
}

export function getRegionForArea(areas: WorldArea[], areaId: string): WorldArea | undefined {
  const area = areas.find(a => a.areaId === areaId);
  if (!area || !area.parentId) return undefined;
  return areas.find(a => a.areaId === area.parentId);
}

export function getSectorAreaHierarchy(areas: WorldArea[], sectorId: string): { area?: WorldArea; region?: WorldArea } {
  const area = areas.find(a => a.level === 'AREA' && a.sectorIds.includes(sectorId));
  if (!area || !area.parentId) return { area };
  const region = areas.find(a => a.areaId === area.parentId);
  return { area, region };
}

export function isAreaDiscovered(area: WorldArea): boolean {
  return area.completionState !== 'UNDISCOVERED';
}

export function isAreaCompleted(area: WorldArea): boolean {
  return area.completionState === 'COMPLETED' || area.completionState === 'MASTERED';
}

export function isAreaMastered(area: WorldArea): boolean {
  return area.completionState === 'MASTERED';
}