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


export function mergeActivityFeatures(base: ActivityFeatures | null | undefined, current: ActivityFeatures): ActivityFeatures {
 if (!base) return { ...current };
 const usableBase = Math.max(0, base.sampleCount - base.rejectedSamples);
 const usableCurrent = Math.max(0, current.sampleCount - current.rejectedSamples);
 const usable = usableBase + usableCurrent;
 const samples = Math.max(1, base.sampleCount + current.sampleCount);
 const durationSeconds = base.durationSeconds + current.durationSeconds;
 const distanceMeters = base.distanceMeters + current.distanceMeters;
 const movingWeight = Math.max(1, base.movingSeconds + current.movingSeconds);
 const medianSpeedMps = (
   base.medianSpeedMps * Math.max(0, base.movingSeconds) +
   current.medianSpeedMps * Math.max(0, current.movingSeconds)
 ) / movingWeight;
 const variance = (
   base.speedVariance * Math.max(1, base.sampleCount) +
   current.speedVariance * Math.max(1, current.sampleCount)
 ) / samples;
 return {
   distanceMeters,
   durationSeconds,
   averageSpeedMps: durationSeconds > 0 ? distanceMeters / durationSeconds : 0,
   medianSpeedMps: Number.isFinite(medianSpeedMps) ? medianSpeedMps : 0,
   maxSpeedMps: Math.max(base.maxSpeedMps, current.maxSpeedMps),
   speedVariance: Number.isFinite(variance) ? Math.max(0, variance) : 0,
   accelerationChanges: base.accelerationChanges + current.accelerationChanges,
   stops: base.stops + current.stops,
   movingSeconds: base.movingSeconds + current.movingSeconds,
   stationarySeconds: base.stationarySeconds + current.stationarySeconds,
   gpsGaps: base.gpsGaps + current.gpsGaps,
   rejectedSamples: base.rejectedSamples + current.rejectedSamples,
   teleportCount: base.teleportCount + current.teleportCount,
   sampleCount: base.sampleCount + current.sampleCount,
   meanAccuracy: usable > 0
     ? (base.meanAccuracy * usableBase + current.meanAccuracy * usableCurrent) / usable
     : Math.max(base.meanAccuracy, current.meanAccuracy),
   maxAccuracy: Math.max(base.maxAccuracy, current.maxAccuracy),
   mocked: base.mocked || current.mocked,
 };
}
