import type { LocationObject } from 'expo-location';
import { distanceBetween, isUsableLocation } from '../verification/gps';
import type { ActivityFeatures } from './types';
// Fixed histogram + one anchor. No raw route or unbounded sample array survives a session.
export function createActivityWindow() {
 let anchor: LocationObject | null = null, first: number | null = null, last = 0;
 let distance = 0, moving = 0, stationary = 0, gaps = 0, rejected = 0, teleports = 0;
 let count = 0, accuracySum = 0, maxAccuracy = 0, mocked = false, speedSum = 0, squareSum = 0;
 let segments = 0, maxSpeed = 0, previousSpeed = 0, accelerations = 0, stops = 0, currentSpeed = 0;
 const histogram = new Array<number>(161).fill(0);
 function add(point: LocationObject, now = Date.now()) {
   count++; mocked ||= point.mocked === true;
   if (!isUsableLocation(point, now)) { rejected++; return; }
   const accuracy = point.coords.accuracy!; accuracySum += accuracy; maxAccuracy = Math.max(maxAccuracy, accuracy);
   if (first === null) { first = point.timestamp; last = point.timestamp; anchor = point; return; }
   if (point.timestamp <= last) { rejected++; return; }
   last = point.timestamp;
   if (!anchor) { anchor = point; return; }
   const seconds = (point.timestamp - anchor.timestamp) / 1000;
   const meters = distanceBetween(anchor, point), speed = meters / seconds;
   if (seconds > 15) { gaps++; anchor = point; return; }
   if (speed > 40 || meters > 250) { teleports++; rejected++; return; } // retain anchor: one spike cannot poison the next fix
   if (meters < Math.max(3, (accuracy + anchor.coords.accuracy!) / 2)) {
     currentSpeed = 0;
     if (seconds >= 10) { stationary += seconds; if (previousSpeed > 0.6) stops++; previousSpeed = 0; anchor = point; }
     return;
   }
   distance += meters; moving += seconds; segments++; speedSum += speed; squareSum += speed * speed;
   histogram[Math.min(160, Math.round(speed * 4))]++; maxSpeed = Math.max(maxSpeed, speed);
   if (Math.abs(speed - previousSpeed) / seconds > 3) accelerations++;
   previousSpeed = currentSpeed = speed; anchor = point;
 }
 function features(): ActivityFeatures {
   let median = 0, seen = 0;
   for (let i = 0; i < histogram.length; i++) { seen += histogram[i]; if (seen >= Math.max(1, segments / 2)) { median = i / 4; break; } }
   const duration = first === null ? 0 : Math.max(0, (last - first) / 1000);
   return { distanceMeters: distance, durationSeconds: duration, averageSpeedMps: duration ? distance / duration : 0,
     medianSpeedMps: median, maxSpeedMps: maxSpeed, speedVariance: segments ? Math.max(0, squareSum / segments - (speedSum / segments) ** 2) : 0,
     accelerationChanges: accelerations, stops, movingSeconds: moving, stationarySeconds: stationary,
     gpsGaps: gaps, rejectedSamples: rejected, teleportCount: teleports, sampleCount: count,
     meanAccuracy: count > rejected ? accuracySum / (count - rejected) : 100, maxAccuracy, mocked };
 }
 return { add, features, currentSpeed: () => currentSpeed };
}
