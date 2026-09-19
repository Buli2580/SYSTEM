import type * as Location from 'expo-location';

export function distanceBetween(
  first: Location.LocationObject,
  second: Location.LocationObject
) {
  const earthRadius = 6371000;

  const lat1 =
    (first.coords.latitude * Math.PI) / 180;

  const lat2 =
    (second.coords.latitude * Math.PI) / 180;

  const deltaLat =
    ((second.coords.latitude -
      first.coords.latitude) *
      Math.PI) /
    180;

  const deltaLon =
    ((second.coords.longitude -
      first.coords.longitude) *
      Math.PI) /
    180;

  const a =
    Math.sin(deltaLat / 2) *
      Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadius * c;
}

export function verificationScoreForAccuracy(
  accuracy: number | null
) {
  if (accuracy === null || !Number.isFinite(accuracy) || accuracy < 0) return 0;

  if (accuracy <= 10) return 100;
  if (accuracy <= 20) return 95;
  if (accuracy <= 35) return 90;
  if (accuracy <= 50) return 82;

  return 70;
}
// Reject unknown accuracy, stale/out-of-order fixes and Android mock locations.
export function isUsableLocation(location: Location.LocationObject, now = Date.now()) {
  const { latitude, longitude, accuracy } = location.coords;
  return location.mocked !== true &&
    Number.isFinite(latitude) && Math.abs(latitude) <= 90 &&
    Number.isFinite(longitude) && Math.abs(longitude) <= 180 &&
    accuracy !== null && Number.isFinite(accuracy) && accuracy >= 0 && accuracy <= 50 &&
    Number.isFinite(location.timestamp) &&
    location.timestamp <= now + 1000 && now - location.timestamp <= 15000;
}

export function verifiedSegment(first: Location.LocationObject, second: Location.LocationObject) {
  const seconds = (second.timestamp - first.timestamp) / 1000;
  if (seconds <= 0 || seconds > 15) return 0;
  const meters = distanceBetween(first, second);
  // Require displacement beyond a portion of the reported uncertainty radius.
  const noiseFloor = Math.max(3, ((first.coords.accuracy ?? 50) + (second.coords.accuracy ?? 50)) / 2);
  if (!Number.isFinite(meters) || meters < noiseFloor || meters > 100 || meters / seconds > 8.5) return 0;
  return meters;
}
