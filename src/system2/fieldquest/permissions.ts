import * as Location from 'expo-location';
import type { FieldQuestPermissions, DeviceReadiness } from './types';

export async function checkLocationPermission(): Promise<FieldQuestPermissions['location']> {
  try {
    const permission = await Location.getForegroundPermissionsAsync();
    switch (permission.status) {
      case 'granted': return 'GRANTED';
      case 'denied': return 'DENIED';
      case 'undetermined': return 'UNKNOWN';
      default: return 'UNKNOWN';
    }
  } catch {
    return 'UNAVAILABLE';
  }
}

export async function requestLocationPermission(): Promise<FieldQuestPermissions['location']> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    switch (permission.status) {
      case 'granted': return 'GRANTED';
      case 'denied': return permission.canAskAgain ? 'DENIED' : 'BLOCKED';
      default: return 'UNKNOWN';
    }
  } catch {
    return 'UNAVAILABLE';
  }
}

export async function checkGPSAvailability(): Promise<boolean> {
  try {
    return await Location.hasServicesEnabledAsync();
  } catch {
    return false;
  }
}

export async function getDeviceReadiness(): Promise<DeviceReadiness> {
  const location = await checkLocationPermission();
  const gpsAvailable = await checkGPSAvailability();
  const blockingIssues: string[] = [];

  if (location === 'DENIED') blockingIssues.push('Location permission denied');
  if (location === 'BLOCKED') blockingIssues.push('Location permission permanently blocked');
  if (location === 'UNAVAILABLE') blockingIssues.push('Location services unavailable');
  if (!gpsAvailable) blockingIssues.push('GPS/Location services disabled');

  return {
    permissions: { location },
    location,
    gpsAvailable,
    ready: location === 'GRANTED' && gpsAvailable,
    blockingIssues,
  };
}

export function formatReadinessForUI(readiness: DeviceReadiness): string {
  if (readiness.ready) return 'READY';
  if (readiness.blockingIssues.length > 0) return readiness.blockingIssues.join('; ');
  return 'NOT READY';
}