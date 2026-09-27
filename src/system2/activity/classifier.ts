import type { ActivityEvidence, ActivityFeatures, ActivityType, ReasonCode, SensorSummary, Verdict } from './types';
import {antiCheat2Decision,type AntiCheat2Signal} from '../verification/antiCheat2';
export const WALK_PROFILE = 'WALK', RUN_PROFILE = 'RUN', BIKE_PROFILE = 'BIKE', EXPLORATION_PROFILE = 'UNKNOWN';
export function classifyActivity(expected: ActivityType, f: ActivityFeatures, sensors: SensorSummary = {}): ActivityEvidence {
 // Explicit projection prevents raw locations/streams from entering persisted evidence.
 const keys = ['distanceMeters','durationSeconds','averageSpeedMps','medianSpeedMps','maxSpeedMps','speedVariance','accelerationChanges','stops','movingSeconds','stationarySeconds','gpsGaps','rejectedSamples','teleportCount','sampleCount','meanAccuracy','maxAccuracy'] as const;
 f = Object.fromEntries([...keys.map(k => [k, f[k]]), ['mocked', f.mocked]]) as ActivityFeatures;
 sensors = { ...(sensors.steps !== undefined ? { steps: sensors.steps } : {}), ...(sensors.cadence !== undefined ? { cadence: sensors.cadence } : {}), ...(sensors.motion !== undefined ? { motion: sensors.motion } : {}) };
 const reasons: ReasonCode[] = [];
 const state: { verdict: Verdict } = { verdict: 'VERIFIED' };
 let detected: ActivityType = 'UNKNOWN';
 const reject = (code: ReasonCode) => { reasons.push(code); state.verdict = 'REJECTED'; };
 const suspect = (code: ReasonCode) => { reasons.push(code); if (state.verdict !== 'REJECTED') state.verdict = 'SUSPICIOUS'; };
 const stepsAvailable = sensors.steps !== undefined, motionAvailable = sensors.motion !== undefined;
 const periodic = sensors.motion === 'PERIODIC' || (stepsAvailable && sensors.steps! > 20 && (sensors.cadence ?? 0) >= 65);
 if (keys.some(k => !Number.isFinite(f[k]) || f[k] < 0) || typeof f.mocked !== 'boolean' ||
     [sensors.steps, sensors.cadence].some(value => value !== undefined && (!Number.isFinite(value) || value < 0))) reject('SENSOR_DATA_INSUFFICIENT');
 if (f.mocked) reject('MOCK_LOCATION');
 if (f.teleportCount > 2) reject('GPS_TELEPORT');
 if (f.maxSpeedMps > 35) reject('IMPOSSIBLE_SPEED');
 if (f.sampleCount < 8 || f.durationSeconds < 30) suspect('SENSOR_DATA_INSUFFICIENT');
 if (f.meanAccuracy > 30 || f.rejectedSamples / Math.max(1, f.sampleCount) > .3) suspect('GPS_POOR_ACCURACY');
 if (f.gpsGaps > Math.max(2, f.durationSeconds / 120)) suspect('TOO_MANY_GPS_GAPS');
 if (f.accelerationChanges > Math.max(3, f.sampleCount * .12)) suspect('UNREALISTIC_ACCELERATION');
 const smooth = f.speedVariance < .12 && f.stops === 0;
 if (f.distanceMeters < 15 || f.movingSeconds < 10) detected = 'STATIONARY';
 else if (f.medianSpeedMps > 11 && f.averageSpeedMps > 8 && !periodic) detected = 'VEHICLE';
 else if (periodic) detected = (sensors.cadence ?? 0) >= 130 || f.medianSpeedMps > 2.8 ? 'RUN' : 'WALK';
 else if (stepsAvailable && sensors.steps === 0 && f.medianSpeedMps > 2) detected = 'BIKE';
 else if (f.medianSpeedMps <= 2.4) detected = 'WALK';
 else if (f.medianSpeedMps > 5.8 && smooth) detected = 'BIKE';
 else if (!smooth && f.medianSpeedMps >= 2 && f.medianSpeedMps <= 8) detected = 'RUN';
 // GPS alone cannot reliably distinguish slow bicycle/car from steady running.
 if (expected !== 'UNKNOWN') {
   if (detected === 'VEHICLE' || detected === 'STATIONARY') reject('ACTIVITY_TYPE_MISMATCH');
   else if (detected !== expected) suspect('ACTIVITY_TYPE_MISMATCH');
   if (expected === 'RUN' && stepsAvailable && sensors.steps === 0) reject('NO_STEP_PATTERN');
   if ((expected === 'RUN' || expected === 'WALK') && sensors.cadence !== undefined && (sensors.cadence < 50 || sensors.cadence > 250)) suspect('STEP_RATE_MISMATCH');
   if (sensors.motion === 'STILL' && f.distanceMeters > 100) reject('SPEED_PATTERN_MISMATCH');
 }

 // Anti-Cheat 2.0 aggregates the same bounded sensor summary used by the
 // classifier. It never sees raw GPS routes, photos or historic health data.
 const antiSignals:AntiCheat2Signal[]=[];
 if(f.mocked)antiSignals.push({kind:'MOCKED_LOCATION',severity:3});
 if(f.teleportCount>0)antiSignals.push({kind:'TELEPORT',severity:f.teleportCount>2?3:2});
 if(f.maxSpeedMps>35)antiSignals.push({kind:'IMPOSSIBLE_SPEED',severity:3});
 const gapLimit=Math.max(2,f.durationSeconds/120);
 if(f.gpsGaps>gapLimit)antiSignals.push({kind:'SENSOR_GAP',severity:f.gpsGaps>gapLimit*2?3:2});
 const anti=antiCheat2Decision(antiSignals);
 if(anti.action==='REJECT'&&state.verdict!=='REJECTED'){
   if(f.mocked)reject('MOCK_LOCATION');
   else if(f.teleportCount>0)reject('GPS_TELEPORT');
   else if(f.maxSpeedMps>35)reject('IMPOSSIBLE_SPEED');
   else reject('SENSOR_DATA_INSUFFICIENT');
 }else if(anti.action==='REVIEW'&&state.verdict==='VERIFIED'){
   if(f.teleportCount>0)suspect('GPS_TELEPORT');
   else if(f.gpsGaps>gapLimit)suspect('TOO_MANY_GPS_GAPS');
   else suspect('SENSOR_DATA_INSUFFICIENT');
 }

 const baseCap = stepsAvailable && motionAvailable ? 98 : stepsAvailable || motionAvailable ? 93 : 87;
 const antiCap=anti.action==='REJECT'?0:anti.action==='REVIEW'?60:anti.action==='DOWNGRADE'?75:baseCap;
 const cap=Math.min(baseCap,antiCap||baseCap);
 const penalty = Math.min(25, f.teleportCount * 3 + f.gpsGaps * 2 + Math.max(0, f.meanAccuracy - 10) * .3);
 const score = state.verdict === 'REJECTED' ? 0 : Math.round(Math.max(0, Math.min(state.verdict === 'SUSPICIOUS' ? 60 : cap, cap - penalty)));
 if (state.verdict === 'VERIFIED' && score < 70) suspect('SENSOR_DATA_INSUFFICIENT');
 return { activityTypeExpected: expected, activityTypeDetected: detected, verificationScore: score, verdict: state.verdict,
   reasonCodes: [...new Set(reasons)], features: { ...f }, sensors: { ...sensors },
   sensorSources: ['GPS', ...(stepsAvailable ? ['STEPS' as const] : []), ...(motionAvailable ? ['MOTION' as const] : [])],
   additionalProofRequired: state.verdict === 'SUSPICIOUS' };
}
export function verdictMessage(e: ActivityEvidence) {
 if (e.reasonCodes.includes('MOCK_LOCATION')) return 'Lokalizacja testowa nie może potwierdzić aktywności.';
 if (e.reasonCodes.includes('GPS_POOR_ACCURACY') || e.reasonCodes.includes('GPS_TELEPORT')) return 'GPS nie był wystarczająco wiarygodny. Spróbuj ponownie na otwartej przestrzeni.';
 return e.verdict === 'REJECTED' ? 'Dane ruchu nie potwierdzają wymagań tej misji. Możesz rozpocząć nową próbę.' : 'Nie mamy wystarczającej pewności, że aktywność odpowiada wymaganiom questa. Spróbuj ponownie.';
}
