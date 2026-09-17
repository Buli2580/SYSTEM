import * as Location from 'expo-location';

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
  if (accuracy === null) return 80;

  if (accuracy <= 10) return 100;
  if (accuracy <= 20) return 95;
  if (accuracy <= 35) return 90;
  if (accuracy <= 50) return 82;

  return 70;
}