// SYSTEM 2.0 — LANDMARK DISCOVERY
// Landmark gameplay with discovery states

import type { GeoPoint } from '../core';
import type { Poi } from './poi';

export type LandmarkState =
  | 'UNKNOWN'
  | 'DETECTED'
  | 'DISCOVERED'
  | 'VISITED';

export interface Landmark {
  landmarkId: string;
  poiId: string;
  name: string;
  coordinates: GeoPoint;
  sectorId: string;
  areaId?: string;
  regionId?: string;
  state: LandmarkState;
  firstDetectedAt?: string;
  firstDiscoveredAt?: string;
  firstVisitedAt?: string;
  visitCount: number;
  lastVisitedAt?: string;
  collectionState: LandmarkCollectionState;
  metadata: LandmarkMetadata;
  createdAt: string;
  updatedAt: string;
}

export type LandmarkCollectionState =
  | 'NOT_COLLECTED'
  | 'COLLECTED'
  | 'MASTERED';

export interface LandmarkMetadata {
  category: 'LANDMARK' | 'MONUMENT' | 'VIEWPOINT' | 'HISTORIC' | 'CULTURAL' | 'NATURAL';
  description?: string;
  significance?: string;
  difficulty?: 'EASY' | 'MODERATE' | 'HARD';
  accessibility?: 'WHEELCHAIR' | 'WALKING' | 'HIKING' | 'CLIMBING';
  bestTimeToVisit?: string;
  tags?: string[];
}

export interface LandmarkSectorIndex {
  sectorId: string;
  landmarkIds: string[];
}

export interface LandmarkDiscoveryReward {
  realXp: number;
  explorationXp: number;
  bonusItems?: string[];
}

export const LANDMARK_DISCOVERY_REWARDS: Record<string, LandmarkDiscoveryReward> = {
  FIRST_DISCOVERY: { realXp: 50, explorationXp: 100 },
  FIRST_VISIT: { realXp: 100, explorationXp: 200 },
  REVISIT: { realXp: 10, explorationXp: 20 },
};

export function createLandmarkFromPoi(poi: Poi, sectorId: string): Landmark {
  const now = new Date().toISOString();
  return {
    landmarkId: `landmark_${poi.poiId}`,
    poiId: poi.poiId,
    name: poi.name,
    coordinates: poi.coordinates,
    sectorId,
    areaId: poi.areaId,
    regionId: poi.regionId,
    state: 'UNKNOWN',
    visitCount: 0,
    collectionState: 'NOT_COLLECTED',
    metadata: {
      category: mapPoiCategoryToLandmarkCategory(poi.category),
      description: poi.metadata.description,
      tags: poi.metadata.tags ? Object.keys(poi.metadata.tags) : [],
    },
    createdAt: now,
    updatedAt: now,
  };
}

function mapPoiCategoryToLandmarkCategory(category: string): LandmarkMetadata['category'] {
  switch (category) {
    case 'LANDMARK': return 'LANDMARK';
    case 'MONUMENT': return 'MONUMENT';
    case 'VIEWPOINT': return 'VIEWPOINT';
    case 'HISTORIC': return 'HISTORIC';
    case 'CULTURAL': return 'CULTURAL';
    case 'NATURAL': return 'NATURAL';
    default: return 'CULTURAL';
  }
}

export function detectLandmark(landmark: Landmark): Landmark {
  if (landmark.state !== 'UNKNOWN') return landmark;
  return {
    ...landmark,
    state: 'DETECTED',
    firstDetectedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function discoverLandmark(landmark: Landmark): Landmark {
  if (landmark.state === 'DISCOVERED' || landmark.state === 'VISITED') return landmark;
  return {
    ...landmark,
    state: 'DISCOVERED',
    firstDiscoveredAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function visitLandmark(landmark: Landmark): Landmark {
  const now = new Date().toISOString();
  const isFirstVisit = landmark.state !== 'VISITED';
  return {
    ...landmark,
    state: 'VISITED',
    firstVisitedAt: isFirstVisit ? now : landmark.firstVisitedAt,
    visitCount: landmark.visitCount + 1,
    lastVisitedAt: now,
    updatedAt: now,
  };
}

export function collectLandmark(landmark: Landmark): Landmark {
  if (landmark.collectionState !== 'NOT_COLLECTED') return landmark;
  return {
    ...landmark,
    collectionState: 'COLLECTED',
    updatedAt: new Date().toISOString(),
  };
}

export function masterLandmark(landmark: Landmark): Landmark {
  if (landmark.collectionState === 'MASTERED') return landmark;
  return {
    ...landmark,
    collectionState: 'MASTERED',
    updatedAt: new Date().toISOString(),
  };
}

export function getLandmarkDiscoveryReward(landmark: Landmark, action: 'DISCOVER' | 'VISIT' | 'REVISIT'): LandmarkDiscoveryReward {
  switch (action) {
    case 'DISCOVER':
      return landmark.firstDiscoveredAt ? LANDMARK_DISCOVERY_REWARDS.FIRST_DISCOVERY : { realXp: 0, explorationXp: 0 };
    case 'VISIT':
      return landmark.firstVisitedAt ? LANDMARK_DISCOVERY_REWARDS.FIRST_VISIT : { realXp: 0, explorationXp: 0 };
    case 'REVISIT':
      return LANDMARK_DISCOVERY_REWARDS.REVISIT;
    default:
      return { realXp: 0, explorationXp: 0 };
  }
}

export function isLandmarkDiscoveryIdempotent(landmark: Landmark, action: 'DISCOVER' | 'VISIT'): boolean {
  if (action === 'DISCOVER') return landmark.state === 'DISCOVERED' || landmark.state === 'VISITED';
  if (action === 'VISIT') return landmark.state === 'VISITED';
  return false;
}

export function getLandmarksByState(landmarks: Landmark[], state: LandmarkState): Landmark[] {
  return landmarks.filter(l => l.state === state);
}

export function getLandmarksBySector(landmarks: Landmark[], sectorId: string): Landmark[] {
  return landmarks.filter(l => l.sectorId === sectorId);
}

export function getUndiscoveredLandmarks(landmarks: Landmark[]): Landmark[] {
  return landmarks.filter(l => l.state === 'UNKNOWN' || l.state === 'DETECTED');
}

export function getLandmarkProgress(landmarks: Landmark[]): { total: number; discovered: number; visited: number; collected: number; mastered: number } {
  return {
    total: landmarks.length,
    discovered: landmarks.filter(l => l.state === 'DISCOVERED' || l.state === 'VISITED').length,
    visited: landmarks.filter(l => l.state === 'VISITED').length,
    collected: landmarks.filter(l => l.collectionState === 'COLLECTED' || l.collectionState === 'MASTERED').length,
    mastered: landmarks.filter(l => l.collectionState === 'MASTERED').length,
  };
}