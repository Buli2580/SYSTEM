// SYSTEM 2.0 - Building Domain
// Lightweight building representation independent from map provider

import type { GeoPoint } from '../core';

export type BuildingHeightSource = 'MAP_DATA' | 'LEVEL_ESTIMATE' | 'UNKNOWN';

export type BuildingType = 
  | 'RESIDENTIAL'
  | 'COMMERCIAL'
  | 'INDUSTRIAL'
  | 'PUBLIC'
  | 'HISTORIC'
  | 'LANDMARK'
  | 'UNKNOWN';

export interface Building {
  buildingId: string;
  geometryId: string; // Reference to geometry in map data
  centroid: GeoPoint;
  height: number; // meters
  heightSource: BuildingHeightSource;
  levels?: number;
  buildingType: BuildingType;
  sectorId: string;
  discovered: boolean;
  discoveredAt?: string;
  exploredAt?: string;
}

export interface BuildingGeometry {
  buildingId: string;
  coordinates: Array<Array<{ latitude: number; longitude: number }>>; // Polygon rings
  centroid: GeoPoint;
  height: number; // meters
  minHeight: number; // base height
}

export interface BuildingSectorIndex {
  sectorId: string;
  buildingIds: string[];
  centroid: GeoPoint;
  bounds: [number, number, number, number]; // [west, south, east, north]
}

export type BuildingHeightSourceType = 'MAP_DATA' | 'LEVEL_ESTIMATE' | 'UNKNOWN';

export function estimateHeightFromLevels(levels: number, type: BuildingType): number {
  const baseHeight = 3; // meters per level
  const typeMultiplier: Record<BuildingType, number> = {
    RESIDENTIAL: 1.0,
    COMMERCIAL: 1.3,
    INDUSTRIAL: 1.5,
    PUBLIC: 1.2,
    HISTORIC: 1.1,
    LANDMARK: 1.5,
    UNKNOWN: 1.0,
  };
  return Math.round(levels * baseHeight * typeMultiplier[type]);
}

export function estimateLevelsFromHeight(height: number, type: BuildingType): number {
  const baseHeight = 3;
  const typeMultiplier: Record<BuildingType, number> = {
    RESIDENTIAL: 1.0,
    COMMERCIAL: 1.3,
    INDUSTRIAL: 1.5,
    PUBLIC: 1.2,
    HISTORIC: 1.1,
    LANDMARK: 1.5,
    UNKNOWN: 1.0,
  };
  return Math.max(1, Math.round(height / (baseHeight * typeMultiplier[type])));
}

export interface CreateBuildingInput {
  buildingId?: string;
  geometryId?: string;
  centroid?: { latitude: number; longitude: number };
  height?: number;
  heightSource?: 'MAP_DATA' | 'LEVEL_ESTIMATE' | 'UNKNOWN';
  levels?: number;
  buildingType?: 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL' | 'PUBLIC' | 'HISTORIC' | 'LANDMARK' | 'UNKNOWN';
  sectorId?: string;
  discovered?: boolean;
  discoveredAt?: string;
  exploredAt?: string;
}

export interface CreateBuildingOutput {
  buildingId: string;
  geometryId: string;
  centroid: { latitude: number; longitude: number };
  height: number;
  heightSource: 'MAP_DATA' | 'LEVEL_ESTIMATE' | 'UNKNOWN';
  levels: number;
  buildingType: 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL' | 'PUBLIC' | 'HISTORIC' | 'LANDMARK' | 'UNKNOWN';
  sectorId: string;
  discovered: boolean;
  discoveredAt?: string;
  exploredAt?: string;
}

export function createBuilding(partial: CreateBuildingInput): CreateBuildingOutput {
  const id = partial.buildingId || `building_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const height = partial.height ?? (partial.levels ? estimateHeightFromLevels(partial.levels, partial.buildingType ?? 'UNKNOWN') : 0);
  const heightSource = partial.heightSource ?? (partial.height ? 'MAP_DATA' : partial.levels ? 'LEVEL_ESTIMATE' : 'UNKNOWN');
  const levels = partial.levels ?? (partial.height ? estimateLevelsFromHeight(partial.height, partial.buildingType ?? 'UNKNOWN') : 0);
  const buildingType = partial.buildingType ?? 'UNKNOWN';
  
  return {
    buildingId: id,
    geometryId: partial.geometryId || `geom_${Date.now()}`,
    centroid: partial.centroid ?? { latitude: 0, longitude: 0 },
    height,
    heightSource,
    levels,
    buildingType,
    sectorId: partial.sectorId || 'unknown',
    discovered: partial.discovered ?? false,
    discoveredAt: partial.discoveredAt,
    exploredAt: partial.exploredAt,
  };
}

export interface CreateBuildingGeometryInput {
  buildingId: string;
  coordinates: Array<Array<{ latitude: number; longitude: number }>>;
  centroid: { latitude: number; longitude: number };
  height: number;
  minHeight: number;
}

export interface CreateBuildingGeometryOutput {
  buildingId: string;
  coordinates: Array<Array<{ latitude: number; longitude: number }>>;
  centroid: { latitude: number; longitude: number };
  height: number;
  minHeight: number;
}

export function createBuildingGeometry(partial: CreateBuildingGeometryInput): CreateBuildingGeometryOutput {
  return {
    buildingId: partial.buildingId,
    coordinates: partial.coordinates,
    centroid: partial.centroid,
    height: partial.height,
    minHeight: partial.minHeight,
  };
}

export function getBuildingSector(building: { centroid: { latitude: number; longitude: number } }): string {
  // This would use the sector system
  return 'unknown';
}

export function getNearbyBuildings(
  buildings: Array<{ buildingId: string; centroid: { latitude: number; longitude: number } }>,
  center: { latitude: number; longitude: number },
  radiusMeters: number
) {
  return buildings
    .map(b => ({
      buildingId: b.buildingId,
      distance: haversineDistance(
        { latitude: b.centroid.latitude, longitude: b.centroid.longitude },
        center
      ),
    }))
    .filter(b => b.distance <= radiusMeters)
    .sort((a, b) => a.distance - b.distance);
}

function haversineDistance(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const R = 6371000;
  const lat1 = a.latitude * Math.PI / 180;
  const lat2 = b.latitude * Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * Math.PI / 180;
  const dLon = (b.longitude - a.longitude) * Math.PI / 180;
  const haversine = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(a.latitude * Math.PI / 180) * Math.cos(b.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return R * c;
}