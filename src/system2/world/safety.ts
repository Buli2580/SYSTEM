// SYSTEM 2.0 — WORLD SAFETY ENGINE
// Safety classification for real-world locations

import type { GeoPoint } from '../core';
import type { GeoPoint as CoreGeoPoint } from '../core';

export type SafetyClassification =
  | 'SAFE_PUBLIC'
  | 'CONDITIONAL'
  | 'UNKNOWN'
  | 'AVOID';

export type SafetyHazard =
  | 'RAILWAY'
  | 'MOTORWAY'
  | 'RESTRICTED_AREA'
  | 'PRIVATE_PROPERTY'
  | 'DANGEROUS_TERRAIN'
  | 'WATER'
  | 'INACCESSIBLE'
  | 'HIGH_TRAFFIC'
  | 'INDUSTRIAL'
  | 'CONSTRUCTION';

export interface SafetyAssessment {
  classification: SafetyClassification;
  hazards: SafetyHazard[];
  confidence: number; // 0-1
  reasons: string[];
  safeAlternative?: GeoPoint;
  assessedAt: string;
}

export interface SafetyZone {
  zoneId: string;
  bounds: [number, number, number, number]; // [west, south, east, north]
  classification: SafetyClassification;
  hazards: SafetyHazard[];
  name?: string;
  source: 'INFERRED' | 'MANUAL' | 'PROVIDER' | 'COMMUNITY';
  createdAt: string;
  updatedAt: string;
}

export interface SafeArea {
  areaId: string;
  name: string;
  center: GeoPoint;
  radiusMeters: number;
  classification: SafetyClassification;
  poiCount: number;
  landmarkCount: number;
  signalCount: number;
  cacheCount: number;
  lastValidatedAt: string;
}

export type PoiCategory =
  | 'PARK'
  | 'FOREST'
  | 'TRAIL'
  | 'SPORT'
  | 'GYM'
  | 'LANDMARK'
  | 'MONUMENT'
  | 'PUBLIC_SQUARE'
  | 'VIEWPOINT'
  | 'WATERFRONT'
  | 'PUBLIC_BUILDING'
  | 'TRANSIT'
  | 'SHOPPING'
  | 'OTHER';

const UNSAFE_CATEGORIES: PoiCategory[] = ['TRANSIT', 'SHOPPING'];
const SAFE_CATEGORIES: PoiCategory[] = ['PARK', 'PUBLIC_SQUARE', 'VIEWPOINT', 'WATERFRONT', 'PUBLIC_BUILDING', 'LANDMARK', 'MONUMENT'];
const CONDITIONAL_CATEGORIES: PoiCategory[] = ['FOREST', 'TRAIL', 'SPORT', 'GYM', 'OTHER'];

const HAZARD_TAGS: Record<string, SafetyHazard[]> = {
  railway: ['RAILWAY'],
  motorway: ['MOTORWAY'],
  highway: ['MOTORWAY', 'HIGH_TRAFFIC'],
  restricted: ['RESTRICTED_AREA'],
  private: ['PRIVATE_PROPERTY'],
  cliff: ['DANGEROUS_TERRAIN'],
  water: ['WATER'],
  river: ['WATER'],
  lake: ['WATER'],
  sea: ['WATER'],
  ocean: ['WATER'],
  industrial: ['INDUSTRIAL'],
  construction: ['CONSTRUCTION'],
  military: ['RESTRICTED_AREA'],
};

export function classifyPoiSafety(poi: { category: PoiCategory; metadata?: { tags?: Record<string, string> } }): SafetyAssessment {
  const hazards: SafetyHazard[] = [];
  let classification: SafetyClassification = 'UNKNOWN';
  const reasons: string[] = [];

  if (SAFE_CATEGORIES.includes(poi.category)) {
    classification = 'SAFE_PUBLIC';
    reasons.push(`Category "${poi.category}" is generally safe and public`);
  } else if (UNSAFE_CATEGORIES.includes(poi.category)) {
    classification = 'AVOID';
    reasons.push(`Category "${poi.category}" may direct players to unsafe areas`);
  } else if (CONDITIONAL_CATEGORIES.includes(poi.category)) {
    classification = 'CONDITIONAL';
    reasons.push(`Category "${poi.category}" requires contextual assessment`);
  }

  if (poi.metadata?.tags) {
    for (const [key, value] of Object.entries(poi.metadata.tags)) {
      const keyLower = key.toLowerCase();
      const valueLower = value.toLowerCase();
      for (const [tag, tagHazards] of Object.entries(HAZARD_TAGS)) {
        if (keyLower.includes(tag) || valueLower.includes(tag)) {
          hazards.push(...tagHazards);
          reasons.push(`Tag "${key}=${value}" indicates ${tagHazards.join(', ')}`);
        }
      }
    }
  }

  const uniqueHazards = Array.from(new Set(hazards));
  if (uniqueHazards.includes('RAILWAY') || uniqueHazards.includes('MOTORWAY') || uniqueHazards.includes('RESTRICTED_AREA')) {
    classification = 'AVOID';
  } else if (uniqueHazards.length > 0 && classification === 'SAFE_PUBLIC') {
    classification = 'CONDITIONAL';
  }

  return {
    classification,
    hazards: uniqueHazards,
    confidence: uniqueHazards.length > 0 ? 0.8 : classification === 'SAFE_PUBLIC' ? 0.9 : 0.6,
    reasons,
    assessedAt: new Date().toISOString(),
  };
}

export function classifyCoordinateSafety(
  coordinate: CoreGeoPoint,
  nearbyPois: Array<{ category: PoiCategory; coordinates: CoreGeoPoint; metadata?: { tags?: Record<string, string> } }>,
  knownZones: SafetyZone[]
): SafetyAssessment {
  const hazards: SafetyHazard[] = [];
  const reasons: string[] = [];
  let classification: SafetyClassification = 'UNKNOWN';

  for (const zone of knownZones) {
    const [w, s, e, n] = zone.bounds;
    if (coordinate.longitude >= w && coordinate.longitude <= e && coordinate.latitude >= s && coordinate.latitude <= n) {
      hazards.push(...zone.hazards);
      reasons.push(`Inside safety zone "${zone.zoneId}" with hazards: ${zone.hazards.join(', ')}`);
      if (zone.classification === 'AVOID') classification = 'AVOID';
      else if (zone.classification === 'CONDITIONAL' && classification !== 'AVOID') classification = 'CONDITIONAL';
      else if (zone.classification === 'SAFE_PUBLIC' && classification === 'UNKNOWN') classification = 'SAFE_PUBLIC';
    }
  }

  for (const poi of nearbyPois) {
    const assessment = classifyPoiSafety(poi);
    hazards.push(...assessment.hazards);
    reasons.push(...assessment.reasons);
    if (assessment.classification === 'AVOID') classification = 'AVOID';
    else if (assessment.classification === 'CONDITIONAL' && classification !== 'AVOID') classification = 'CONDITIONAL';
    else if (assessment.classification === 'SAFE_PUBLIC' && classification === 'UNKNOWN') classification = 'SAFE_PUBLIC';
  }

  if (classification === 'UNKNOWN') {
    classification = 'UNKNOWN';
    reasons.push('No safety data available for this location');
  }

  return {
    classification,
    hazards: Array.from(new Set(hazards)),
    confidence: hazards.length > 0 ? 0.8 : classification === 'SAFE_PUBLIC' ? 0.9 : 0.5,
    reasons,
    assessedAt: new Date().toISOString(),
  };
}

export function findSafeAlternative(
  unsafeCoordinate: CoreGeoPoint,
  safeAreas: SafeArea[],
  maxDistanceKm = 5
): SafeArea | null {
  const nearby = safeAreas
    .filter(area => haversineDistance(unsafeCoordinate, area.center) <= maxDistanceKm * 1000)
    .filter(area => area.classification === 'SAFE_PUBLIC')
    .sort((a, b) => haversineDistance(unsafeCoordinate, a.center) - haversineDistance(unsafeCoordinate, b.center));
  return nearby[0] || null;
}

export function createSafeArea(
  center: CoreGeoPoint,
  radiusMeters: number,
  name: string,
  poiCount: number,
  landmarkCount: number,
  signalCount: number,
  cacheCount: number
): SafeArea {
  return {
    areaId: `safe_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    name,
    center,
    radiusMeters,
    classification: 'SAFE_PUBLIC',
    poiCount,
    landmarkCount,
    signalCount,
    cacheCount,
    lastValidatedAt: new Date().toISOString(),
  };
}

export function isSafeForQuest(assessment: SafetyAssessment): boolean {
  return assessment.classification === 'SAFE_PUBLIC' || assessment.classification === 'CONDITIONAL';
}

export function getSafeQuestFallback(assessment: SafetyAssessment, safeAreas: SafeArea[]): { area: SafeArea; reason: string } | null {
  if (isSafeForQuest(assessment)) return null;
  if (!assessment.safeAlternative && safeAreas.length > 0) {
    const alternative = findSafeAlternative(
      { latitude: 0, longitude: 0 },
      safeAreas
    );
    if (alternative) {
      return { area: alternative, reason: 'Original location classified as unsafe; redirecting to nearest safe area' };
    }
  }
  return null;
}

function haversineDistance(a: CoreGeoPoint, b: CoreGeoPoint): number {
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