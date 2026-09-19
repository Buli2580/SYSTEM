// SYSTEM 2.0 — ANOMALY ENCOUNTER ENGINE
// Anomaly lifecycle: DETECTED → SCANNED → INVESTIGATING → RESOLVED

import type { GeoPoint } from '../core';
import type { QuestReward, SkillKey, QuestDifficulty } from '../core/types';

export type AnomalyType =
  | 'DISTORTION'
  | 'ENERGY_SPIKE'
  | 'UNKNOWN_SIGNAL'
  | 'TEMPORAL_ECHO';

export type AnomalyState =
  | 'DETECTED'
  | 'SCANNED'
  | 'INVESTIGATING'
  | 'RESOLVED'
  | 'EXPIRED';

export type AnomalySeverity = 'MINOR' | 'MODERATE' | 'MAJOR' | 'CRITICAL';

export interface Anomaly {
  anomalyId: string;
  type: AnomalyType;
  state: AnomalyState;
  severity: AnomalySeverity;
  coordinates: GeoPoint;
  sectorId: string;
  areaId?: string;
  regionId?: string;
  discoveredAt: string;
  scannedAt?: string;
  investigationStartedAt?: string;
  resolvedAt?: string;
  expiredAt?: string;
  scanData: AnomalyScanData;
  investigationData: AnomalyInvestigationData;
  rewards: AnomalyReward;
  metadata: AnomalyMetadata;
  deterministicSeed: string;
}

export interface AnomalyScanData {
  frequency?: number;
  amplitude?: number;
  duration?: number;
  pattern?: string;
  radiationLevel?: number;
  temporalOffset?: number;
  spatialDistortion?: number;
  energySignature?: string;
  scannedBy?: string;
  scanQuality: number;
}

export interface AnomalyInvestigationData {
  observations: AnomalyObservation[];
  samplesCollected: number;
  analysisComplete: boolean;
  hypothesis?: string;
  conclusion?: string;
  investigationDuration: number;
  investigatorId?: string;
}

export interface AnomalyObservation {
  observationId: string;
  timestamp: string;
  type: 'VISUAL' | 'AUDITORY' | 'INSTRUMENT' | 'PHYSICAL' | 'TEMPORAL';
  description: string;
  data: Record<string, unknown>;
  confidence: number;
}

export interface AnomalyReward {
  realXp: number;
  skillXp: Partial<Record<SkillKey, number>>;
  gameEnergy: number;
  anomalyEssence: number;
  bonusItems?: string[];
}

export interface AnomalyMetadata {
  context: string;
  timeOfDay: string;
  weatherConditions?: string;
  nearbyPOIs: string[];
  playerLevelAtDiscovery: number;
  explorerRankAtDiscovery: number;
}

export interface AnomalyConfig {
  scanRadius: number;
  investigationRadius: number;
  scanCooldownMs: number;
  investigationTimeoutMs: number;
  expirationMs: number;
  baseRewards: Record<AnomalyType, AnomalyReward>;
  severityMultipliers: Record<AnomalySeverity, number>;
}

export const DEFAULT_ANOMALY_CONFIG: AnomalyConfig = {
  scanRadius: 100,
  investigationRadius: 50,
  scanCooldownMs: 5 * 60 * 1000,
  investigationTimeoutMs: 30 * 60 * 1000,
  expirationMs: 6 * 60 * 60 * 1000,
  baseRewards: {
    DISTORTION: { realXp: 200, skillXp: { INT: 100, RES: 50 }, gameEnergy: 20, anomalyEssence: 10 },
    ENERGY_SPIKE: { realXp: 250, skillXp: { INT: 120, VIT: 60 }, gameEnergy: 25, anomalyEssence: 15 },
    UNKNOWN_SIGNAL: { realXp: 300, skillXp: { INT: 150, CRE: 75 }, gameEnergy: 30, anomalyEssence: 20 },
    TEMPORAL_ECHO: { realXp: 400, skillXp: { INT: 200, WIL: 100 }, gameEnergy: 40, anomalyEssence: 30 },
  },
  severityMultipliers: {
    MINOR: 1.0,
    MODERATE: 1.5,
    MAJOR: 2.0,
    CRITICAL: 3.0,
  },
};

export function createAnomaly(
  type: AnomalyType,
  coordinates: GeoPoint,
  sectorId: string,
  areaId: string | undefined,
  regionId: string | undefined,
  severity: AnomalySeverity,
  seed: string,
  playerLevel: number,
  explorerRank: number
): Anomaly {
  const now = new Date().toISOString();
  return {
    anomalyId: `anomaly_${type.toLowerCase()}_${Date.now()}_${seed.slice(0, 8)}`,
    type,
    state: 'DETECTED',
    severity,
    coordinates,
    sectorId,
    areaId,
    regionId,
    discoveredAt: now,
    scanData: {
      scanQuality: 0,
    },
    investigationData: {
      observations: [],
      samplesCollected: 0,
      analysisComplete: false,
      investigationDuration: 0,
    },
    rewards: calculateAnomalyRewards(type, severity, playerLevel),
    metadata: {
      context: '',
      timeOfDay: getTimeOfDay(),
      nearbyPOIs: [],
      playerLevelAtDiscovery: playerLevel,
      explorerRankAtDiscovery: explorerRank,
    },
    deterministicSeed: seed,
  };
}

function calculateAnomalyRewards(type: AnomalyType, severity: AnomalySeverity, playerLevel: number): AnomalyReward {
  const base = DEFAULT_ANOMALY_CONFIG.baseRewards[type];
  const severityMult = DEFAULT_ANOMALY_CONFIG.severityMultipliers[severity];
  const levelMult = 1 + playerLevel * 0.02;

  return {
    realXp: Math.round(base.realXp * severityMult * levelMult),
    skillXp: Object.fromEntries(
      Object.entries(base.skillXp).map(([k, v]) => [k, Math.round(v * severityMult * levelMult)])
    ),
    gameEnergy: Math.round(base.gameEnergy * severityMult),
    anomalyEssence: Math.round(base.anomalyEssence * severityMult),
    bonusItems: severity === 'CRITICAL' ? ['anomaly_core'] : undefined,
  };
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'MORNING';
  if (hour >= 12 && hour < 17) return 'AFTERNOON';
  if (hour >= 17 && hour < 21) return 'EVENING';
  return 'NIGHT';
}

export function scanAnomaly(anomaly: Anomaly, playerLocation: GeoPoint, scanQuality: number): Anomaly {
  if (anomaly.state !== 'DETECTED') return anomaly;
  if (!isInScanRange(anomaly, playerLocation)) return anomaly;

  const scanData = generateScanData(anomaly.type, scanQuality, anomaly.deterministicSeed);
  return {
    ...anomaly,
    state: 'SCANNED',
    scannedAt: new Date().toISOString(),
    scanData,
  };
}

function isInScanRange(anomaly: Anomaly, playerLocation: GeoPoint): boolean {
  const { haversineDistance } = require('./proximity');
  return haversineDistance(playerLocation, anomaly.coordinates) <= DEFAULT_ANOMALY_CONFIG.scanRadius;
}

function generateScanData(type: AnomalyType, quality: number, seed: string): AnomalyScanData {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash) + seed.charCodeAt(i);
  hash = Math.abs(hash);

  const patterns: Record<AnomalyType, string[]> = {
    DISTORTION: ['spatial_wave', 'gravity_lens', 'reality_tear'],
    ENERGY_SPIKE: ['power_surge', 'plasma_burst', 'ion_storm'],
    UNKNOWN_SIGNAL: ['encrypted_burst', 'frequency_hop', 'quantum_entangled'],
    TEMPORAL_ECHO: ['time_loop', 'causality_violation', 'chronon_particle'],
  };

  return {
    frequency: Math.round(100 + (hash % 900) * quality),
    amplitude: Math.round(10 + (hash % 90) * quality),
    duration: Math.round(5 + (hash % 55) * quality),
    pattern: patterns[type][hash % patterns[type].length],
    radiationLevel: Math.round((hash % 100) * quality) / 100,
    temporalOffset: type === 'TEMPORAL_ECHO' ? Math.round((hash % 1000) - 500) : undefined,
    spatialDistortion: type === 'DISTORTION' ? Math.round((hash % 100) * quality) / 100 : undefined,
    energySignature: type === 'ENERGY_SPIKE' ? `sig_${hash.toString(36).slice(0, 8)}` : undefined,
    scanQuality: quality,
  };
}

export function startInvestigation(anomaly: Anomaly, playerLocation: GeoPoint, investigatorId: string): Anomaly {
  if (anomaly.state !== 'SCANNED') return anomaly;
  if (!isInInvestigationRange(anomaly, playerLocation)) return anomaly;

  return {
    ...anomaly,
    state: 'INVESTIGATING',
    investigationStartedAt: new Date().toISOString(),
    investigationData: {
      ...anomaly.investigationData,
      investigatorId,
      investigationDuration: 0,
    },
  };
}

function isInInvestigationRange(anomaly: Anomaly, playerLocation: GeoPoint): boolean {
  const { haversineDistance } = require('./proximity');
  return haversineDistance(playerLocation, anomaly.coordinates) <= DEFAULT_ANOMALY_CONFIG.investigationRadius;
}

export function addObservation(anomaly: Anomaly, observation: Omit<AnomalyObservation, 'observationId' | 'timestamp'>): Anomaly {
  if (anomaly.state !== 'INVESTIGATING') return anomaly;

  const newObservation: AnomalyObservation = {
    ...observation,
    observationId: `obs_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    timestamp: new Date().toISOString(),
  };

  return {
    ...anomaly,
    investigationData: {
      ...anomaly.investigationData,
      observations: [...anomaly.investigationData.observations, newObservation],
      samplesCollected: anomaly.investigationData.samplesCollected + 1,
    },
  };
}

export function updateInvestigationDuration(anomaly: Anomaly, additionalMs: number): Anomaly {
  if (anomaly.state !== 'INVESTIGATING') return anomaly;

  return {
    ...anomaly,
    investigationData: {
      ...anomaly.investigationData,
      investigationDuration: anomaly.investigationData.investigationDuration + additionalMs,
    },
  };
}

export function completeInvestigation(anomaly: Anomaly, hypothesis: string, conclusion: string): Anomaly {
  if (anomaly.state !== 'INVESTIGATING') return anomaly;

  return {
    ...anomaly,
    state: 'RESOLVED',
    resolvedAt: new Date().toISOString(),
    investigationData: {
      ...anomaly.investigationData,
      analysisComplete: true,
      hypothesis,
      conclusion,
    },
  };
}

export function expireAnomaly(anomaly: Anomaly): Anomaly {
  if (anomaly.state === 'RESOLVED' || anomaly.state === 'EXPIRED') return anomaly;
  return { ...anomaly, state: 'EXPIRED', expiredAt: new Date().toISOString() };
}

export function isAnomalyExpired(anomaly: Anomaly, now = Date.now()): boolean {
  if (anomaly.state === 'RESOLVED' || anomaly.state === 'EXPIRED') return true;
  const discovered = new Date(anomaly.discoveredAt).getTime();
  return now - discovered > DEFAULT_ANOMALY_CONFIG.expirationMs;
}

export function canScanAnomaly(anomaly: Anomaly, lastScanTime: number, now = Date.now()): boolean {
  if (anomaly.state !== 'DETECTED') return false;
  return now - lastScanTime >= DEFAULT_ANOMALY_CONFIG.scanCooldownMs;
}

export function getAnomalyProgress(anomaly: Anomaly): number {
  switch (anomaly.state) {
    case 'DETECTED': return 10;
    case 'SCANNED': return 30;
    case 'INVESTIGATING':
      const obsCount = anomaly.investigationData.observations.length;
      return Math.min(30 + obsCount * 15, 90);
    case 'RESOLVED': return 100;
    case 'EXPIRED': return 0;
    default: return 0;
  }
}

export function getAnomalyDifficulty(type: AnomalyType, severity: AnomalySeverity): QuestDifficulty {
  const baseDifficulty: Record<AnomalyType, QuestDifficulty> = {
    DISTORTION: 'NORMAL',
    ENERGY_SPIKE: 'NORMAL',
    UNKNOWN_SIGNAL: 'HARD',
    TEMPORAL_ECHO: 'EXTREME',
  };
  const severityBoost: Record<AnomalySeverity, number> = { MINOR: 0, MODERATE: 1, MAJOR: 2, CRITICAL: 3 };
  const base = baseDifficulty[type];
  const boost = severityBoost[severity];
  const levels: QuestDifficulty[] = ['EASY', 'NORMAL', 'HARD', 'EXTREME'];
  const baseIndex = levels.indexOf(base);
  return levels[Math.min(baseIndex + boost, levels.length - 1)];
}

export function getAnomalyDescription(type: AnomalyType, severity: AnomalySeverity): string {
  const descriptions: Record<AnomalyType, Record<AnomalySeverity, string>> = {
    DISTORTION: {
      MINOR: 'A slight spatial distortion detected. Reality seems slightly bent.',
      MODERATE: 'A noticeable spatial distortion. Objects appear displaced.',
      MAJOR: 'Strong spatial distortion. Navigation instruments malfunction.',
      CRITICAL: 'Severe reality tear. Dangerous spatial anomalies present.',
    },
    ENERGY_SPIKE: {
      MINOR: 'Minor energy fluctuation detected in the area.',
      MODERATE: 'Significant energy spike. Electronic devices affected.',
      MAJOR: 'Major energy surge. High radiation levels detected.',
      CRITICAL: 'Critical energy event. Extreme danger to equipment and personnel.',
    },
    UNKNOWN_SIGNAL: {
      MINOR: 'Weak unknown signal detected. Pattern unclear.',
      MODERATE: 'Moderate unknown signal. Encrypted or encoded pattern.',
      MAJOR: 'Strong unknown signal. Complex multi-frequency transmission.',
      CRITICAL: 'Overwhelming unknown signal. Possible quantum origin.',
    },
    TEMPORAL_ECHO: {
      MINOR: 'Faint temporal echo. Time feels slightly off.',
      MODERATE: 'Clear temporal echo. Past events briefly visible.',
      MAJOR: 'Strong temporal anomaly. Time loops detected.',
      CRITICAL: 'Critical temporal event. Causality violations imminent.',
    },
  };
  return descriptions[type][severity];
}

export function getAnomalyContext(type: AnomalyType): string[] {
  const contexts: Record<AnomalyType, string[]> = {
    DISTORTION: ['Near geological faults', 'Ancient structures', 'High magnetic fields'],
    ENERGY_SPIKE: ['Power infrastructure', 'Storm systems', 'Industrial zones'],
    UNKNOWN_SIGNAL: ['Transit hubs', 'Research facilities', 'Military zones'],
    TEMPORAL_ECHO: ['Historical sites', 'Astronomical alignments', 'Ley line intersections'],
  };
  return contexts[type] || [];
}