// SYSTEM 2.0 — REAL WORLD POI
// Provider-independent POI domain with adapter interfaces

import type { GeoPoint } from '../core';

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

export type PoiSource = 'OPENSTREETMAP' | 'OVERPASS' | 'MANUAL' | 'CACHED' | 'UNKNOWN';

export interface Poi {
  poiId: string;
  providerId: string;
  name: string;
  coordinates: GeoPoint;
  sectorId: string;
  areaId?: string;
  regionId?: string;
  category: PoiCategory;
  metadata: PoiMetadata;
  discovered: boolean;
  discoveredAt?: string;
  visited: boolean;
  visitedAt?: string;
  visitCount: number;
  lastVisitedAt?: string;
  source: PoiSource;
  createdAt: string;
  updatedAt: string;
}

export interface PoiMetadata {
  description?: string;
  openingHours?: string;
  website?: string;
  phone?: string;
  wheelchairAccessible?: boolean;
  amenities?: string[];
  tags?: Record<string, string>;
  rawData?: Record<string, unknown>;
}

export interface PoiSectorIndex {
  sectorId: string;
  poiIds: string[];
}

export interface PoiAreaIndex {
  areaId: string;
  poiIds: string[];
}

export interface PoiAdapter {
  readonly name: string;
  readonly version: string;
  readonly source: PoiSource;
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  fetchPoisInSector(sectorId: string, categories?: PoiCategory[]): Promise<Poi[]>;
  fetchPoisInBounds(bounds: [number, number, number, number], categories?: PoiCategory[]): Promise<Poi[]>;
  fetchPoisNearby(center: GeoPoint, radiusMeters: number, categories?: PoiCategory[]): Promise<Poi[]>;
  searchPois(query: string, bounds?: [number, number, number, number]): Promise<Poi[]>;
  getPoiById(poiId: string): Promise<Poi | null>;
  getPoiByProviderId(providerId: string): Promise<Poi | null>;
}

export interface PoiProviderConfig {
  enabled: boolean;
  apiKey?: string;
  rateLimit?: { requests: number; windowMs: number };
  cacheTtlMs?: number;
  categories?: PoiCategory[];
  bounds?: [number, number, number, number];
}

export interface PoiRegistryEntry {
  poi: Poi;
  adapterName: string;
  lastFetchedAt: number;
  etag?: string;
}

export function createPoiId(providerId: string): string {
  return `poi_${providerId}`;
}

export function createPoi(partial: Partial<Poi> & { providerId: string; coordinates: GeoPoint; category: PoiCategory }): Poi {
  const now = new Date().toISOString();
  const sectorId = partial.sectorId || '';
  return {
    poiId: partial.poiId || createPoiId(partial.providerId),
    providerId: partial.providerId,
    name: partial.name || 'Unknown POI',
    coordinates: partial.coordinates,
    sectorId,
    areaId: partial.areaId,
    regionId: partial.regionId,
    category: partial.category,
    metadata: partial.metadata || {},
    discovered: partial.discovered ?? false,
    discoveredAt: partial.discoveredAt,
    visited: partial.visited ?? false,
    visitedAt: partial.visitedAt,
    visitCount: partial.visitCount ?? 0,
    lastVisitedAt: partial.lastVisitedAt,
    source: partial.source || 'UNKNOWN',
    createdAt: partial.createdAt || now,
    updatedAt: now,
  };
}

export function isPoiDiscovered(poi: Poi): boolean {
  return poi.discovered;
}

export function isPoiVisited(poi: Poi): boolean {
  return poi.visited;
}

export function markPoiDiscovered(poi: Poi): Poi {
  if (poi.discovered) return poi;
  return { ...poi, discovered: true, discoveredAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}

export function markPoiVisited(poi: Poi): Poi {
  if (poi.visited) return { ...poi, visitCount: poi.visitCount + 1, lastVisitedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  return { ...poi, visited: true, visitedAt: new Date().toISOString(), visitCount: 1, lastVisitedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}

export function getPoisByCategory(pois: Poi[], category: PoiCategory): Poi[] {
  return pois.filter(p => p.category === category);
}

export function getNearbyPois(pois: Poi[], center: GeoPoint, radiusMeters: number): Array<Poi & { distance: number }> {
  return pois
    .map(poi => ({ ...poi, distance: haversineDistance(poi.coordinates, center) }))
    .filter(poi => poi.distance <= radiusMeters)
    .sort((a, b) => a.distance - b.distance);
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

export function getLandmarkPois(pois: Poi[]): Poi[] {
  return pois.filter(p => p.category === 'LANDMARK' || p.category === 'MONUMENT' || p.category === 'VIEWPOINT');
}

export function getSafePois(pois: Poi[]): Poi[] {
  const safeCategories: PoiCategory[] = ['PARK', 'PUBLIC_SQUARE', 'VIEWPOINT', 'WATERFRONT', 'PUBLIC_BUILDING', 'LANDMARK', 'MONUMENT'];
  return pois.filter(p => safeCategories.includes(p.category));
}