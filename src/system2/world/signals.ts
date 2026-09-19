import type { LocationObject } from 'expo-location';
import type { GeoPoint } from '../core';
import { distanceBetween, isUsableLocation } from '../verification/gps';

export const SIGNAL_ID = 'first_world_signal_v1';
export type WorldSignal = GeoPoint & { id: string; status: 'DETECTED' | 'LOCATED'; revision: number };
export function signalDistance(location: LocationObject, signal: GeoPoint) {
  return distanceBetween(location, { ...location, coords: { ...location.coords, ...signal } });
}
export function validSignal(signal: WorldSignal): boolean {
  return signal?.id === SIGNAL_ID && ['DETECTED', 'LOCATED'].includes(signal.status) &&
    Number.isSafeInteger(signal.revision) && signal.revision >= 0 &&
    Number.isFinite(signal.latitude) && Math.abs(signal.latitude) <= 85 &&
    Number.isFinite(signal.longitude) && Math.abs(signal.longitude) <= 180;
}
export function generateSignal(origin: LocationObject, revision = 0): WorldSignal {
  if (!isUsableLocation(origin) || Math.abs(origin.coords.latitude) > 85) throw new Error('Potrzebna jest aktualna, dokładna pozycja GPS.');
  // Controlled bearing changes on relocation; no home/origin is persisted.
  const bearing = ((revision * 137.508 + 47) % 360) * Math.PI / 180;
  const arc = 420 / 6371000;
  const lat = origin.coords.latitude * Math.PI / 180;
  const lon = origin.coords.longitude * Math.PI / 180;
  const nextLat = Math.asin(Math.sin(lat) * Math.cos(arc) + Math.cos(lat) * Math.sin(arc) * Math.cos(bearing));
  const nextLon = lon + Math.atan2(Math.sin(bearing) * Math.sin(arc) * Math.cos(lat), Math.cos(arc) - Math.sin(lat) * Math.sin(nextLat));
  const result: WorldSignal = { id: SIGNAL_ID, status: 'DETECTED', revision,
    latitude: nextLat * 180 / Math.PI, longitude: ((nextLon * 180 / Math.PI + 540) % 360) - 180 };
  if (!validSignal(result)) throw new Error('Nie udało się wygenerować sygnału.');
  return result;
}
export function signalReached(fix: LocationObject, signal: WorldSignal, now = Date.now()) {
  // Entire reported uncertainty circle must fit inside the 40m target radius.
  return validSignal(signal) && isUsableLocation(fix, now) && (fix.coords.accuracy ?? 100) <= 20 &&
    signalDistance(fix, signal) + (fix.coords.accuracy ?? 100) <= 40;
}
