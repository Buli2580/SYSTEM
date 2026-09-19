import type { LocationObject } from 'expo-location';
import { distanceBetween, isUsableLocation } from '../verification/gps';

export function acceptWorldLocation(next: LocationObject, previous: LocationObject | null, now = Date.now()) {
  if (!isUsableLocation(next, now)) return false;
  if (next.coords.speed !== null && (!Number.isFinite(next.coords.speed) || next.coords.speed > 65)) return false;
  if (!previous) return true;
  const seconds = (next.timestamp - previous.timestamp) / 1000;
  if (seconds <= 0) return false;
  // Separate World profile: walking, bikes and cars are supported (up to 65m/s).
  // Shared accuracy/age/mock validation remains identical to the quest profile.
  const uncertainty = (previous.coords.accuracy ?? 0) + (next.coords.accuracy ?? 0);
  return distanceBetween(previous, next) <= 65 * seconds + uncertainty;
}
