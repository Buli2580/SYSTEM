// SYSTEM 2.0 — WORLD CONTEXT / BIOME
// Real-world gameplay context classification

import type { GeoPoint } from '../core';
import type { Poi, PoiCategory } from './poi';

export type WorldContext =
  | 'URBAN'
  | 'RESIDENTIAL'
  | 'COMMERCIAL'
  | 'PARK'
  | 'NATURE'
  | 'TRAIL'
  | 'WATERFRONT'
  | 'MIXED'
  | 'UNKNOWN';

export type ContextConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';

export interface ContextAssessment {
  context: WorldContext;
  confidence: ContextConfidence;
  contributingFactors: ContextFactor[];
  assessedAt: string;
}

export interface ContextFactor {
  type: 'POI_CATEGORY' | 'POI_DENSITY' | 'LAND_USE' | 'ROAD_TYPE' | 'NATURAL_FEATURE' | 'BUILDING_DENSITY';
  value: string;
  weight: number;
  supports: WorldContext[];
}

export interface ContextZone {
  zoneId: string;
  bounds: [number, number, number, number];
  context: WorldContext;
  confidence: ContextConfidence;
  factors: ContextFactor[];
  source: 'INFERRED' | 'PROVIDER' | 'MANUAL';
  createdAt: string;
  updatedAt: string;
}

const CONTEXT_POI_WEIGHTS: Record<PoiCategory, Partial<Record<WorldContext, number>>> = {
  PARK: { PARK: 10, NATURE: 5, URBAN: 2 },
  FOREST: { NATURE: 10, TRAIL: 5 },
  TRAIL: { TRAIL: 10, NATURE: 5, PARK: 3 },
  SPORT: { URBAN: 5, RESIDENTIAL: 3, PARK: 3 },
  GYM: { URBAN: 5, COMMERCIAL: 5, RESIDENTIAL: 2 },
  LANDMARK: { URBAN: 8, COMMERCIAL: 3, MIXED: 5 },
  MONUMENT: { URBAN: 8, COMMERCIAL: 3, MIXED: 5 },
  PUBLIC_SQUARE: { URBAN: 10, COMMERCIAL: 5, MIXED: 5 },
  VIEWPOINT: { NATURE: 8, PARK: 5, TRAIL: 3 },
  WATERFRONT: { WATERFRONT: 10, NATURE: 5, URBAN: 3 },
  PUBLIC_BUILDING: { URBAN: 8, COMMERCIAL: 5, RESIDENTIAL: 3 },
  TRANSIT: { URBAN: 10, COMMERCIAL: 8, MIXED: 5 },
  SHOPPING: { COMMERCIAL: 10, URBAN: 8, MIXED: 5 },
  OTHER: { MIXED: 3, UNKNOWN: 5 },
};

const LAND_USE_CONTEXT: Record<string, Partial<Record<WorldContext, number>>> = {
  residential: { RESIDENTIAL: 10, URBAN: 3 },
  commercial: { COMMERCIAL: 10, URBAN: 5 },
  industrial: { URBAN: 3, MIXED: 2 },
  retail: { COMMERCIAL: 10, URBAN: 5 },
  park: { PARK: 10, NATURE: 5, URBAN: 2 },
  forest: { NATURE: 10, TRAIL: 3 },
  grass: { NATURE: 5, PARK: 3 },
  meadow: { NATURE: 5, PARK: 3 },
  water: { WATERFRONT: 10, NATURE: 5 },
  river: { WATERFRONT: 10, NATURE: 5 },
  lake: { WATERFRONT: 10, NATURE: 5 },
  trail: { TRAIL: 10, NATURE: 5, PARK: 3 },
  path: { TRAIL: 8, NATURE: 3 },
  highway: { URBAN: 5, MIXED: 2 },
  motorway: { URBAN: 3, MIXED: 2 },
  pedestrian: { URBAN: 8, RESIDENTIAL: 5, COMMERCIAL: 5 },
};

export function assessWorldContext(
  coordinate: GeoPoint,
  nearbyPois: Poi[],
  landUseTags: Record<string, string> = {},
  buildingDensity?: number
): ContextAssessment {
  const scores: Record<WorldContext, number> = {
    URBAN: 0,
    RESIDENTIAL: 0,
    COMMERCIAL: 0,
    PARK: 0,
    NATURE: 0,
    TRAIL: 0,
    WATERFRONT: 0,
    MIXED: 0,
    UNKNOWN: 0,
  };
  const factors: ContextFactor[] = [];

  for (const poi of nearbyPois) {
    const weights = CONTEXT_POI_WEIGHTS[poi.category] || {};
    for (const [context, weight] of Object.entries(weights)) {
      scores[context as WorldContext] += weight;
      factors.push({
        type: 'POI_CATEGORY',
        value: `${poi.category}:${poi.name}`,
        weight,
        supports: [context as WorldContext],
      });
    }
  }

  for (const [key, value] of Object.entries(landUseTags)) {
    const weights = LAND_USE_CONTEXT[key.toLowerCase()] || LAND_USE_CONTEXT[value.toLowerCase()] || {};
    for (const [context, weight] of Object.entries(weights)) {
      scores[context as WorldContext] += weight;
      factors.push({
        type: 'LAND_USE',
        value: `${key}=${value}`,
        weight,
        supports: [context as WorldContext],
      });
    }
  }

  if (buildingDensity !== undefined) {
    if (buildingDensity > 0.7) {
      scores.URBAN += 15;
      scores.COMMERCIAL += 10;
      scores.RESIDENTIAL += 5;
      factors.push({ type: 'BUILDING_DENSITY', value: `high:${buildingDensity}`, weight: 15, supports: ['URBAN'] });
    } else if (buildingDensity > 0.3) {
      scores.RESIDENTIAL += 10;
      scores.URBAN += 5;
      scores.MIXED += 5;
      factors.push({ type: 'BUILDING_DENSITY', value: `medium:${buildingDensity}`, weight: 10, supports: ['RESIDENTIAL'] });
    } else {
      scores.NATURE += 10;
      scores.PARK += 5;
      factors.push({ type: 'BUILDING_DENSITY', value: `low:${buildingDensity}`, weight: 10, supports: ['NATURE'] });
    }
  }

  let bestContext: WorldContext = 'UNKNOWN';
  let bestScore = 0;
  for (const [context, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestContext = context as WorldContext;
    }
  }

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  let confidence: ContextConfidence = 'NONE';
  if (totalScore > 0) {
    const ratio = bestScore / totalScore;
    if (ratio > 0.6 && bestScore > 20) confidence = 'HIGH';
    else if (ratio > 0.35 && bestScore > 10) confidence = 'MEDIUM';
    else if (bestScore > 5) confidence = 'LOW';
  }

  if (bestContext === 'UNKNOWN' || bestScore < 5) {
    bestContext = 'UNKNOWN';
    confidence = 'NONE';
  }

  return {
    context: bestContext,
    confidence,
    contributingFactors: factors,
    assessedAt: new Date().toISOString(),
  };
}

export function getContextForQuestGeneration(context: WorldContext): { preferredQuestTypes: string[]; avoidedQuestTypes: string[] } {
  const preferences: Record<WorldContext, { preferred: string[]; avoided: string[] }> = {
    URBAN: { preferred: ['EXPLORE_URBAN', 'VISIT_LANDMARK', 'INVESTIGATE_SIGNAL'], avoided: ['HIKING', 'WILDERNESS_SURVIVAL'] },
    RESIDENTIAL: { preferred: ['DISCOVER_SECTOR', 'VISIT_PARK', 'WALK_DISTANCE'], avoided: ['HIGH_TRAFFIC'] },
    COMMERCIAL: { preferred: ['VISIT_LANDMARK', 'INVESTIGATE_SIGNAL'], avoided: ['NATURE_EXPLORATION'] },
    PARK: { preferred: ['VISIT_LANDMARK', 'FIND_CACHE', 'EXPLORE_TRAIL'], avoided: ['URBAN_NAVIGATION'] },
    NATURE: { preferred: ['EXPLORE_TRAIL', 'FIND_CACHE', 'INVESTIGATE_ANOMALY'], avoided: ['URBAN_QUESTS'] },
    TRAIL: { preferred: ['VERIFIED_DISTANCE', 'EXPLORE_TRAIL', 'FIND_CACHE'], avoided: ['URBAN_QUESTS'] },
    WATERFRONT: { preferred: ['VISIT_LANDMARK', 'EXPLORE_WATERFRONT', 'FIND_CACHE'], avoided: ['INTERIOR_QUESTS'] },
    MIXED: { preferred: ['EXPLORE_MIXED', 'VISIT_LANDMARK', 'INVESTIGATE_SIGNAL'], avoided: [] },
    UNKNOWN: { preferred: ['DISCOVER_SECTOR', 'EXPLORE_UNKNOWN'], avoided: [] },
  };
  const selected = preferences[context] || { preferred: [], avoided: [] };
  return { preferredQuestTypes: selected.preferred, avoidedQuestTypes: selected.avoided };
}

export function getContextDescription(context: WorldContext): string {
  const descriptions: Record<WorldContext, string> = {
    URBAN: 'Densely built-up urban area with commercial and residential zones',
    RESIDENTIAL: 'Primarily residential neighborhood with housing and local amenities',
    COMMERCIAL: 'Business and commercial district with shops and offices',
    PARK: 'Public park or green space within urban or suburban area',
    NATURE: 'Natural area such as forest, meadow, or wilderness',
    TRAIL: 'Walking, hiking, or cycling trail',
    WATERFRONT: 'Area adjacent to water body (river, lake, sea)',
    MIXED: 'Mixed-use area with multiple land use types',
    UNKNOWN: 'Insufficient data to determine context',
  };
  return descriptions[context];
}

export function createContextZone(
  bounds: [number, number, number, number],
  context: WorldContext,
  confidence: ContextConfidence,
  factors: ContextFactor[],
  source: 'INFERRED' | 'PROVIDER' | 'MANUAL' = 'INFERRED'
): ContextZone {
  return {
    zoneId: `ctx_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    bounds,
    context,
    confidence,
    factors,
    source,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function isCoordinateInZone(coord: GeoPoint, zone: ContextZone): boolean {
  const [w, s, e, n] = zone.bounds;
  return coord.longitude >= w && coord.longitude <= e && coord.latitude >= s && coord.latitude <= n;
}

export function getContextZoneForCoordinate(zones: ContextZone[], coord: GeoPoint): ContextZone | undefined {
  return zones.find(z => isCoordinateInZone(coord, z));
}