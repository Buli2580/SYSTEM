import * as Location from 'expo-location';
import {
  clearBackgroundQuestSession,
  loadBackgroundQuestSession,
  saveBackgroundQuestSession,
  updateBackgroundQuestSession,
  type StoredLocationPoint,
} from '../storage/database';

export const SYSTEM_BACKGROUND_LOCATION_TASK = 'system.quest.location.v1';

export function storedLocationPoint(location: Location.LocationObject): StoredLocationPoint | null {
  const { latitude, longitude, accuracy } = location.coords;
  if (location.mocked === true || accuracy === null ||
      !Number.isFinite(latitude) || Math.abs(latitude) > 90 ||
      !Number.isFinite(longitude) || Math.abs(longitude) > 180 ||
      !Number.isFinite(accuracy) || accuracy < 0 || accuracy > 50 ||
      !Number.isFinite(location.timestamp)) return null;
  return { latitude, longitude, accuracy, timestamp: location.timestamp, mocked: false };
}

export function locationFromStored(point: StoredLocationPoint): Location.LocationObject {
  return {
    coords: {
      latitude: point.latitude,
      longitude: point.longitude,
      accuracy: point.accuracy,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: point.timestamp,
    mocked: point.mocked,
  };
}

export async function requestBackgroundLocationAccess() {
  const available = await Location.isBackgroundLocationAvailableAsync();
  if (!available) return false;
  const permission = await Location.requestBackgroundPermissionsAsync();
  return permission.status === 'granted';
}

export async function prepareQuestBackgroundTracking(input: {
  questId: string;
  attemptId: string;
  extendedGoal: boolean;
}) {
  const existing = await loadBackgroundQuestSession();
  await saveBackgroundQuestSession({
    questId: input.questId,
    attemptId: input.attemptId,
    mode: 'FOREGROUND',
    extendedGoal: input.extendedGoal,
    ...(existing?.questId === input.questId && existing.attemptId === input.attemptId && existing.lastPoint
      ? { lastPoint: existing.lastPoint } : {}),
    ...(existing?.questId === input.questId && existing.attemptId === input.attemptId &&
      existing.lastObservedTimestamp !== undefined ? { lastObservedTimestamp: existing.lastObservedTimestamp } : {}),
    updatedAt: new Date().toISOString(),
  });

  if (!await Location.hasStartedLocationUpdatesAsync(SYSTEM_BACKGROUND_LOCATION_TASK)) {
    try {
      await Location.startLocationUpdatesAsync(SYSTEM_BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1500,
        distanceInterval: 2,
        deferredUpdatesDistance: 0,
        deferredUpdatesInterval: 0,
        pausesUpdatesAutomatically: false,
        showsBackgroundLocationIndicator: true,
        activityType: Location.ActivityType.Fitness,
        foregroundService: {
          notificationTitle: 'SYSTEM — aktywna misja',
          notificationBody: 'Pomiar dystansu działa w tle.',
          killServiceOnDestroy: false,
        },
      });
    } catch (error) {
      await clearBackgroundQuestSession(input.questId).catch(() => undefined);
      throw error;
    }
  }
}

export async function handoffQuestToBackground(
  questId: string,
  lastLocation?: Location.LocationObject | null,
) {
  const point = lastLocation ? storedLocationPoint(lastLocation) : null;
  await updateBackgroundQuestSession(questId, {
    mode: 'BACKGROUND',
    ...(point ? { lastPoint: point, lastObservedTimestamp: point.timestamp } : {}),
  });
}

export async function markQuestForeground(questId: string) {
  await updateBackgroundQuestSession(questId, { mode: 'FOREGROUND' });
}

export async function stopQuestBackgroundTracking(questId?: string) {
  await clearBackgroundQuestSession(questId).catch(() => undefined);
  const active = await loadBackgroundQuestSession().catch(() => null);
  if (!active && await Location.hasStartedLocationUpdatesAsync(SYSTEM_BACKGROUND_LOCATION_TASK)) {
    await Location.stopLocationUpdatesAsync(SYSTEM_BACKGROUND_LOCATION_TASK).catch(() => undefined);
  }
}
