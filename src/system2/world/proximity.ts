// SYSTEM 2.0 — PROXIMITY / DETECTION ENGINE
// Efficient proximity detection for world entities

import type { GeoPoint } from '../core';

export type ProximityTargetType =
  | 'POI'
  | 'QUEST'
  | 'CACHE'
  | 'ANOMALY'
  | 'BOSS_SIGNAL'
  | 'SPECIAL_DISCOVERY'
  | 'LANDMARK'
  | 'SECTOR';

export type ProximityState =
  | 'UNKNOWN'
  | 'DETECTED'
  | 'DISCOVERED'
  | 'REACHED';

export interface ProximityTarget {
  targetId: string;
  type: ProximityTargetType;
  coordinates: GeoPoint;
  sectorId: string;
  discoveryRadius: number;
  interactionRadius: number;
  metadata?: Record<string, unknown>;
}

export interface ProximityResult {
  target: ProximityTarget;
  distance: number;
  state: ProximityState;
  isApproaching: boolean;
  wasApproaching: boolean;
  timeToReach?: number;
  bearing?: number;
}

export interface ProximityConfig {
  defaultDiscoveryRadius: number;
  defaultInteractionRadius: number;
  maxTrackingDistance: number;
  updateIntervalMs: number;
  hysteresisMeters: number;
  approachingThreshold: number;
}

export const DEFAULT_PROXIMITY_CONFIG: ProximityConfig = {
  defaultDiscoveryRadius: 150,
  defaultInteractionRadius: 30,
  maxTrackingDistance: 2000,
  updateIntervalMs: 1000,
  hysteresisMeters: 10,
  approachingThreshold: 0.9,
};

export interface ProximityStateTracker {
  previousStates: Map<string, ProximityState>;
  previousDistances: Map<string, number>;
  lastUpdate: number;
}

export function createProximityTracker(): ProximityStateTracker {
  return {
    previousStates: new Map(),
    previousDistances: new Map(),
    lastUpdate: Date.now(),
  };
}

export function calculateDistance(a: GeoPoint, b: GeoPoint): number {
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

export function calculateBearing(from: GeoPoint, to: GeoPoint): number {
  const lat1 = from.latitude * Math.PI / 180;
  const lat2 = to.latitude * Math.PI / 180;
  const dLon = (to.longitude - from.longitude) * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
}

export function calculateProximityState(
  distance: number,
  target: ProximityTarget,
  previousState: ProximityState,
  config: ProximityConfig
): ProximityState {
  const discoveryRadius = target.discoveryRadius || config.defaultDiscoveryRadius;
  const interactionRadius = target.interactionRadius || config.defaultInteractionRadius;
  const hysteresis = config.hysteresisMeters;

  if (distance <= interactionRadius + hysteresis) {
    return 'REACHED';
  }
  if (distance <= discoveryRadius + hysteresis) {
    if (previousState === 'DISCOVERED' || previousState === 'REACHED') return 'DISCOVERED';
    return 'DETECTED';
  }
  if (distance <= discoveryRadius * 2) {
    return 'DETECTED';
  }
  return 'UNKNOWN';
}

export function isApproaching(
  currentDistance: number,
  previousDistance: number,
  target: ProximityTarget,
  config: ProximityConfig
): boolean {
  if (previousDistance <= 0) return false;
  const discoveryRadius = target.discoveryRadius || config.defaultDiscoveryRadius;
  const approachingDist = discoveryRadius * config.approachingThreshold;
  return currentDistance < previousDistance && currentDistance < approachingDist;
}

export function updateProximityTracker(
  tracker: ProximityStateTracker,
  results: ProximityResult[]
): ProximityStateTracker {
  const newTracker = { ...tracker };
  for (const result of results) {
    newTracker.previousStates.set(result.target.targetId, result.state);
    newTracker.previousDistances.set(result.target.targetId, result.distance);
  }
  newTracker.lastUpdate = Date.now();
  return newTracker;
}

export function checkProximity(
  playerLocation: GeoPoint,
  targets: ProximityTarget[],
  tracker: ProximityStateTracker,
  config: ProximityConfig = DEFAULT_PROXIMITY_CONFIG
): ProximityResult[] {
  const results: ProximityResult[] = [];

  for (const target of targets) {
    const distance = calculateDistance(playerLocation, target.coordinates);
    if (distance > config.maxTrackingDistance) continue;

    const previousState = tracker.previousStates.get(target.targetId) || 'UNKNOWN';
    const previousDistance = tracker.previousDistances.get(target.targetId) || distance;
    const state = calculateProximityState(distance, target, previousState, config);
    const approaching = isApproaching(distance, previousDistance, target, config);
    const wasApproaching = previousDistance > distance && previousDistance < (target.discoveryRadius || config.defaultDiscoveryRadius) * config.approachingThreshold;
    const bearing = calculateBearing(playerLocation, target.coordinates);

    let timeToReach: number | undefined;
    if (approaching && distance > target.interactionRadius) {
      const speedEstimate = 1.4;
      timeToReach = Math.max(0, (distance - target.interactionRadius) / speedEstimate);
    }

    results.push({
      target,
      distance,
      state,
      isApproaching: approaching,
      wasApproaching,
      timeToReach,
      bearing,
    });
  }

  results.sort((a, b) => a.distance - b.distance);
  return results;
}

export function getNearbyTargets(
  playerLocation: GeoPoint,
  targets: ProximityTarget[],
  radius: number
): ProximityTarget[] {
  return targets
    .map(t => ({ target: t, distance: calculateDistance(playerLocation, t.coordinates) }))
    .filter(({ distance }) => distance <= radius)
    .sort((a, b) => a.distance - b.distance)
    .map(({ target }) => target);
}

export function getTargetsByState(results: ProximityResult[], state: ProximityState): ProximityResult[] {
  return results.filter(r => r.state === state);
}

export function getReachedTargets(results: ProximityResult[]): ProximityResult[] {
  return results.filter(r => r.state === 'REACHED');
}

export function getApproachingTargets(results: ProximityResult[]): ProximityResult[] {
  return results.filter(r => r.isApproaching);
}

export function getDiscoveredTargets(results: ProximityResult[]): ProximityResult[] {
  return results.filter(r => r.state === 'DISCOVERED' || r.state === 'REACHED');
}

export function createProximityTarget(
  targetId: string,
  type: ProximityTargetType,
  coordinates: GeoPoint,
  sectorId: string,
  options: {
    discoveryRadius?: number;
    interactionRadius?: number;
    metadata?: Record<string, unknown>;
  } = {}
): ProximityTarget {
  return {
    targetId,
    type,
    coordinates,
    sectorId,
    discoveryRadius: options.discoveryRadius ?? DEFAULT_PROXIMITY_CONFIG.defaultDiscoveryRadius,
    interactionRadius: options.interactionRadius ?? DEFAULT_PROXIMITY_CONFIG.defaultInteractionRadius,
    metadata: options.metadata,
  };
}

export function createSectorProximityTarget(sectorId: string, center: GeoPoint): ProximityTarget {
  return createProximityTarget(
    `sector_${sectorId}`,
    'SECTOR',
    center,
    sectorId,
    { discoveryRadius: 200, interactionRadius: 50 }
  );
}

export function createPoiProximityTarget(poi: { poiId: string; coordinates: GeoPoint; sectorId: string; category: string }): ProximityTarget {
  const radiusByCategory: Record<string, { discovery: number; interaction: number }> = {
    LANDMARK: { discovery: 200, interaction: 40 },
    MONUMENT: { discovery: 200, interaction: 40 },
    VIEWPOINT: { discovery: 300, interaction: 50 },
    PARK: { discovery: 150, interaction: 30 },
    PUBLIC_SQUARE: { discovery: 100, interaction: 25 },
    WATERFRONT: { discovery: 200, interaction: 40 },
    PUBLIC_BUILDING: { discovery: 100, interaction: 30 },
    TRANSIT: { discovery: 80, interaction: 20 },
    SHOPPING: { discovery: 100, interaction: 30 },
    OTHER: { discovery: 100, interaction: 25 },
  };
  const radii = radiusByCategory[poi.category] || { discovery: 100, interaction: 25 };
  return createProximityTarget(
    `poi_${poi.poiId}`,
    'POI',
    poi.coordinates,
    poi.sectorId,
    { discoveryRadius: radii.discovery, interactionRadius: radii.interaction }
  );
}

export function createCacheProximityTarget(cache: { cacheId: string; coordinates: GeoPoint; sectorId: string; tier: string }): ProximityTarget {
  const radiusByTier: Record<string, { discovery: number; interaction: number }> = {
    COMMON: { discovery: 80, interaction: 20 },
    UNCOMMON: { discovery: 100, interaction: 25 },
    RARE: { discovery: 150, interaction: 30 },
    EPIC: { discovery: 200, interaction: 40 },
  };
  const radii = radiusByTier[cache.tier] || { discovery: 100, interaction: 25 };
  return createProximityTarget(
    `cache_${cache.cacheId}`,
    'CACHE',
    cache.coordinates,
    cache.sectorId,
    { discoveryRadius: radii.discovery, interactionRadius: radii.interaction }
  );
}

export function createAnomalyProximityTarget(anomaly: { anomalyId: string; coordinates: GeoPoint; sectorId: string }): ProximityTarget {
  return createProximityTarget(
    `anomaly_${anomaly.anomalyId}`,
    'ANOMALY',
    anomaly.coordinates,
    anomaly.sectorId,
    { discoveryRadius: 250, interactionRadius: 50 }
  );
}

export function createBossSignalProximityTarget(boss: { bossId: string; coordinates: GeoPoint; sectorId: string }): ProximityTarget {
  return createProximityTarget(
    `boss_${boss.bossId}`,
    'BOSS_SIGNAL',
    boss.coordinates,
    boss.sectorId,
    { discoveryRadius: 500, interactionRadius: 100 }
  );
}