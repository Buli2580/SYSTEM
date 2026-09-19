// SYSTEM 2.0 — WORLD EVENT DIRECTOR
// Dynamic local world events

import type { GeoPoint } from '../core';
import type { WorldContext } from './context';
import type { SpawnType } from './spawn';
import type { CacheTier } from './cache';

export type WorldEventType =
  | 'EXPLORATION_SURGE'
  | 'QUEST_SURGE'
  | 'ANOMALY_WAVE'
  | 'CACHE_RUSH'
  | 'BOSS_ACTIVITY'
  | 'REGION_EVENT'
  | 'SEASONAL_EVENT'
  | 'COMMUNITY_EVENT';

export type WorldEventScope = 'SECTOR' | 'AREA' | 'REGION' | 'GLOBAL';

export type WorldEventState = 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';

export interface WorldEvent {
  eventId: string;
  type: WorldEventType;
  scope: WorldEventScope;
  name: string;
  description: string;
  state: WorldEventState;
  targetIds: string[];
  startTime: string;
  endTime: string;
  intensity: number;
  modifiers: EventModifiers;
  rewards: EventRewards;
  participation: EventParticipation;
  metadata: EventMetadata;
  deterministicSeed: string;
}

export interface EventModifiers {
  spawnRateMultiplier: Record<SpawnType, number>;
  rewardMultiplier: number;
  discoveryRadiusMultiplier: number;
  specialDropsEnabled: boolean;
  uniqueObjectives: string[];
}

export interface EventRewards {
  participationXp: number;
  completionXp: number;
  milestoneRewards: EventMilestoneReward[];
  leaderboardRewards?: EventLeaderboardReward[];
}

export interface EventMilestoneReward {
  milestoneId: string;
  name: string;
  description: string;
  requirement: { type: string; target: number };
  reward: { realXp: number; skillXp: Record<string, number>; gameEnergy: number; items?: string[] };
}

export interface EventLeaderboardReward {
  rank: number;
  reward: { realXp: number; skillXp: Record<string, number>; title?: string; cosmetic?: string };
}

export interface EventParticipation {
  participantCount: number;
  completions: number;
  totalProgress: number;
  topParticipants: Array<{ playerId: string; progress: number; rank: number }>;
}

export interface EventMetadata {
  context: WorldContext;
  timeOfDay: string;
  season?: string;
  weatherConditions?: string;
  isRecurring: boolean;
  recurrencePattern?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventConfig {
  maxConcurrentEvents: number;
  minEventDurationMs: number;
  maxEventDurationMs: number;
  cooldownBetweenEventsMs: number;
  defaultIntensity: number;
  intensityVariance: number;
  participationThresholds: number[];
}

export const DEFAULT_EVENT_CONFIG: EventConfig = {
  maxConcurrentEvents: 3,
  minEventDurationMs: 30 * 60 * 1000,
  maxEventDurationMs: 24 * 60 * 60 * 1000,
  cooldownBetweenEventsMs: 60 * 60 * 1000,
  defaultIntensity: 1.0,
  intensityVariance: 0.5,
  participationThresholds: [1, 5, 10, 25, 50, 100],
};

export function createWorldEvent(
  type: WorldEventType,
  scope: WorldEventScope,
  targetIds: string[],
  startTime: number,
  durationMs: number,
  intensity: number,
  seed: string,
  context: WorldContext,
  isRecurring = false,
  recurrencePattern?: string
): WorldEvent {
  const now = new Date().toISOString();
  const endTime = new Date(startTime + durationMs).toISOString();

  return {
    eventId: `event_${type.toLowerCase()}_${scope.toLowerCase()}_${startTime}_${seed.slice(0, 8)}`,
    type,
    scope,
    name: generateEventName(type, scope),
    description: generateEventDescription(type, scope, intensity),
    state: startTime <= Date.now() ? 'ACTIVE' : 'SCHEDULED',
    targetIds,
    startTime: new Date(startTime).toISOString(),
    endTime,
    intensity: Math.max(0.1, Math.min(3.0, intensity)),
    modifiers: generateEventModifiers(type, intensity),
    rewards: generateEventRewards(type, intensity, scope),
    participation: {
      participantCount: 0,
      completions: 0,
      totalProgress: 0,
      topParticipants: [],
    },
    metadata: {
      context,
      timeOfDay: getTimeOfDay(),
      season: getSeason(),
      isRecurring,
      recurrencePattern,
      createdAt: now,
      updatedAt: now,
    },
    deterministicSeed: seed,
  };
}

function generateEventName(type: WorldEventType, scope: WorldEventScope): string {
  const names: Record<WorldEventType, string> = {
    EXPLORATION_SURGE: 'Exploration Surge',
    QUEST_SURGE: 'Quest Surge',
    ANOMALY_WAVE: 'Anomaly Wave',
    CACHE_RUSH: 'Cache Rush',
    BOSS_ACTIVITY: 'Boss Activity',
    REGION_EVENT: 'Regional Event',
    SEASONAL_EVENT: 'Seasonal Event',
    COMMUNITY_EVENT: 'Community Event',
  };
  const scopeNames: Record<WorldEventScope, string> = {
    SECTOR: 'Sector',
    AREA: 'Area',
    REGION: 'Region',
    GLOBAL: 'Global',
  };
  return `${names[type]} — ${scopeNames[scope]}`;
}

function generateEventDescription(type: WorldEventType, scope: WorldEventScope, intensity: number): string {
  const base: Record<WorldEventType, string> = {
    EXPLORATION_SURGE: 'Increased sector discovery rates and exploration rewards.',
    QUEST_SURGE: 'More world quests available with enhanced rewards.',
    ANOMALY_WAVE: 'Anomalies spawn more frequently and with higher severity.',
    CACHE_RUSH: 'Caches appear more often and with better loot.',
    BOSS_ACTIVITY: 'World bosses are more active and drop better rewards.',
    REGION_EVENT: 'Special regional event with unique objectives.',
    SEASONAL_EVENT: 'Seasonal celebration with limited-time content.',
    COMMUNITY_EVENT: 'Community-driven event with shared goals.',
  };
  const intensityDesc = intensity > 1.5 ? 'Intensity is high!' : intensity > 1.0 ? 'Intensity is elevated.' : 'Standard intensity.';
  return `${base[type]} ${intensityDesc}`;
}

function generateEventModifiers(type: WorldEventType, intensity: number): EventModifiers {
  const baseMultipliers: Record<WorldEventType, Partial<Record<SpawnType, number>>> = {
    EXPLORATION_SURGE: { QUEST_SIGNAL: 2.0, CACHE: 1.5 },
    QUEST_SURGE: { QUEST_SIGNAL: 2.5, CHALLENGE: 1.5 },
    ANOMALY_WAVE: { ANOMALY: 3.0, SPECIAL_DISCOVERY: 2.0 },
    CACHE_RUSH: { CACHE: 3.0, QUEST_SIGNAL: 1.2 },
    BOSS_ACTIVITY: { BOSS_SIGNAL: 5.0, ANOMALY: 1.5 },
    REGION_EVENT: { SPECIAL_DISCOVERY: 2.0, BOSS_SIGNAL: 2.0, ANOMALY: 1.5 },
    SEASONAL_EVENT: { CACHE: 2.0, QUEST_SIGNAL: 1.5, ANOMALY: 1.5 },
    COMMUNITY_EVENT: { QUEST_SIGNAL: 2.0, CACHE: 2.0, SPECIAL_DISCOVERY: 2.0 },
  };

  const multipliers = baseMultipliers[type] || {};
  const result: Record<SpawnType, number> = {
    QUEST_SIGNAL: 1.0,
    CACHE: 1.0,
    ANOMALY: 1.0,
    CHALLENGE: 1.0,
    BOSS_SIGNAL: 1.0,
    SPECIAL_DISCOVERY: 1.0,
  };

  for (const [key, value] of Object.entries(multipliers)) {
    result[key as SpawnType] = 1 + (value - 1) * intensity;
  }

  return {
    spawnRateMultiplier: result,
    rewardMultiplier: 1 + (intensity - 1) * 0.5,
    discoveryRadiusMultiplier: 1 + (intensity - 1) * 0.3,
    specialDropsEnabled: intensity > 1.5,
    uniqueObjectives: generateUniqueObjectives(type),
  };
}

function generateUniqueObjectives(type: WorldEventType): string[] {
  const objectives: Record<WorldEventType, string[]> = {
    EXPLORATION_SURGE: ['DISCOVER_5_SECTORS', 'WALK_10KM', 'VISIT_3_LANDMARKS'],
    QUEST_SURGE: ['COMPLETE_10_QUESTS', 'REACH_5_SIGNALS', 'FINISH_3_CHAINS'],
    ANOMALY_WAVE: ['SCAN_5_ANOMALIES', 'INVESTIGATE_3_ANOMALIES', 'RESOLVE_1_CRITICAL'],
    CACHE_RUSH: ['FIND_10_CACHES', 'CLAIM_1_EPIC', 'COMPLETE_5_CHALLENGES'],
    BOSS_ACTIVITY: ['DEFEAT_1_BOSS', 'REACH_3_BOSS_SIGNALS', 'SURVIVE_1_ENCOUNTER'],
    REGION_EVENT: ['COMPLETE_AREA', 'DISCOVER_ALL_SECTORS', 'FIND_SPECIAL_DISCOVERY'],
    SEASONAL_EVENT: ['COLLECT_SEASONAL_ITEMS', 'COMPLETE_SEASONAL_QUEST', 'REACH_MILESTONE'],
    COMMUNITY_EVENT: ['CONTRIBUTE_PROGRESS', 'HELP_OTHERS', 'ACHIEVE_COMMUNITY_GOAL'],
  };
  return objectives[type] || [];
}

function generateEventRewards(type: WorldEventType, intensity: number, scope: WorldEventScope): EventRewards {
  const scopeMultiplier: Record<WorldEventScope, number> = { SECTOR: 1.0, AREA: 1.5, REGION: 2.0, GLOBAL: 3.0 };
  const mult = scopeMultiplier[scope] * intensity;

  return {
    participationXp: Math.round(100 * mult),
    completionXp: Math.round(500 * mult),
    milestoneRewards: [
      { milestoneId: 'm1', name: 'Participant', description: 'Participate in the event', requirement: { type: 'PARTICIPATE', target: 1 }, reward: { realXp: Math.round(100 * mult), skillXp: { RES: Math.round(50 * mult) }, gameEnergy: Math.round(10 * mult) } },
      { milestoneId: 'm2', name: 'Contributor', description: 'Make significant progress', requirement: { type: 'PROGRESS', target: 50 }, reward: { realXp: Math.round(300 * mult), skillXp: { RES: Math.round(150 * mult), CRE: Math.round(50 * mult) }, gameEnergy: Math.round(20 * mult) } },
      { milestoneId: 'm3', name: 'Champion', description: 'Complete the event objectives', requirement: { type: 'COMPLETE', target: 100 }, reward: { realXp: Math.round(1000 * mult), skillXp: { RES: Math.round(300 * mult), CRE: Math.round(150 * mult), INT: Math.round(100 * mult) }, gameEnergy: Math.round(50 * mult), items: ['event_token'] } },
    ],
    leaderboardRewards: scope !== 'SECTOR' ? [
      { rank: 1, reward: { realXp: Math.round(5000 * mult), skillXp: { RES: Math.round(1000 * mult) }, title: `${type}_CHAMPION`, cosmetic: 'gold_frame' } },
      { rank: 2, reward: { realXp: Math.round(3000 * mult), skillXp: { RES: Math.round(600 * mult) }, title: `${type}_RUNNER_UP`, cosmetic: 'silver_frame' } },
      { rank: 3, reward: { realXp: Math.round(2000 * mult), skillXp: { RES: Math.round(400 * mult) }, title: `${type}_THIRD`, cosmetic: 'bronze_frame' } },
    ] : undefined,
  };
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'MORNING';
  if (hour >= 12 && hour < 17) return 'AFTERNOON';
  if (hour >= 17 && hour < 21) return 'EVENING';
  return 'NIGHT';
}

function getSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'SPRING';
  if (month >= 5 && month <= 7) return 'SUMMER';
  if (month >= 8 && month <= 10) return 'AUTUMN';
  return 'WINTER';
}

export function updateEventState(events: WorldEvent[], now = Date.now()): WorldEvent[] {
  return events.map(event => {
    const start = new Date(event.startTime).getTime();
    const end = new Date(event.endTime).getTime();

    if (event.state === 'SCHEDULED' && now >= start) {
      return { ...event, state: 'ACTIVE' as WorldEventState, updatedAt: new Date().toISOString() };
    }
    if (event.state === 'ACTIVE' && now >= end) {
      return { ...event, state: 'COMPLETED' as WorldEventState, updatedAt: new Date().toISOString() };
    }
    return event;
  });
}

export function getActiveEvents(events: WorldEvent[]): WorldEvent[] {
  return events.filter(e => e.state === 'ACTIVE');
}

export function getEventsForScope(events: WorldEvent[], scope: WorldEventScope, targetId: string): WorldEvent[] {
  return events.filter(e => e.scope === scope && e.targetIds.includes(targetId) && e.state === 'ACTIVE');
}

export function getEventsForLocation(events: WorldEvent[], sectorId: string, areaId?: string, regionId?: string): WorldEvent[] {
  return events.filter(e => {
    if (e.state !== 'ACTIVE') return false;
    if (e.scope === 'SECTOR') return e.targetIds.includes(sectorId);
    if (e.scope === 'AREA' && areaId) return e.targetIds.includes(areaId);
    if (e.scope === 'REGION' && regionId) return e.targetIds.includes(regionId);
    if (e.scope === 'GLOBAL') return true;
    return false;
  });
}

export function registerParticipation(event: WorldEvent, playerId: string, progress: number): WorldEvent {
  const existingIndex = event.participation.topParticipants.findIndex(p => p.playerId === playerId);
  const newTopParticipants = [...event.participation.topParticipants];
  if (existingIndex >= 0) {
    newTopParticipants[existingIndex] = { ...newTopParticipants[existingIndex], progress };
  } else {
    newTopParticipants.push({ playerId, progress, rank: 0 });
  }
  newTopParticipants.sort((a, b) => b.progress - a.progress);
  newTopParticipants.forEach((p, i) => { p.rank = i + 1; });

  return {
    ...event,
    participation: {
      ...event.participation,
      participantCount: Math.max(event.participation.participantCount, newTopParticipants.length),
      totalProgress: event.participation.totalProgress + progress,
      topParticipants: newTopParticipants.slice(0, 100),
    },
    metadata: { ...event.metadata, updatedAt: new Date().toISOString() },
  };
}

export function registerCompletion(event: WorldEvent, playerId: string): WorldEvent {
  return {
    ...event,
    participation: {
      ...event.participation,
      completions: event.participation.completions + 1,
    },
    metadata: { ...event.metadata, updatedAt: new Date().toISOString() },
  };
}

export function getEventProgress(event: WorldEvent, playerId: string): number {
  const participant = event.participation.topParticipants.find(p => p.playerId === playerId);
  return participant?.progress || 0;
}

export function getEventRank(event: WorldEvent, playerId: string): number {
  const participant = event.participation.topParticipants.find(p => p.playerId === playerId);
  return participant?.rank || 0;
}

export function isEventActive(event: WorldEvent, now = Date.now()): boolean {
  if (event.state !== 'ACTIVE') return false;
  const start = new Date(event.startTime).getTime();
  const end = new Date(event.endTime).getTime();
  return now >= start && now < end;
}

export function getEventTimeRemaining(event: WorldEvent, now = Date.now()): number {
  const end = new Date(event.endTime).getTime();
  return Math.max(0, end - now);
}

export function generateScheduledEvents(
  currentTime: number,
  config: EventConfig,
  existingEvents: WorldEvent[],
  context: WorldContext,
  playerLevel: number,
  explorerRank: number
): WorldEvent[] {
  const activeCount = existingEvents.filter(e => e.state === 'ACTIVE' || e.state === 'SCHEDULED').length;
  if (activeCount >= config.maxConcurrentEvents) return [];

  const lastEvent = existingEvents
    .filter(e => e.state === 'COMPLETED' || e.state === 'EXPIRED')
    .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())[0];

  if (lastEvent) {
    const timeSinceLast = currentTime - new Date(lastEvent.endTime).getTime();
    if (timeSinceLast < config.cooldownBetweenEventsMs) return [];
  }

  const events: WorldEvent[] = [];
  const eventTypes: WorldEventType[] = [
    'EXPLORATION_SURGE', 'QUEST_SURGE', 'ANOMALY_WAVE', 'CACHE_RUSH', 'BOSS_ACTIVITY', 'REGION_EVENT'
  ];

  if (playerLevel < 10) {
    eventTypes.splice(eventTypes.indexOf('BOSS_ACTIVITY'), 1);
  }
  if (explorerRank < 3) {
    eventTypes.splice(eventTypes.indexOf('ANOMALY_WAVE'), 1);
  }

  const numEvents = Math.min(2, config.maxConcurrentEvents - activeCount);
  const selectedTypes = shuffleArray(eventTypes, `${currentTime}`).slice(0, numEvents);

  for (const type of selectedTypes) {
    const scope = selectScope(playerLevel, explorerRank);
    const targetIds = selectTargets(scope, `${currentTime}_${type}`);
    const startTime = currentTime + Math.random() * 60 * 60 * 1000;
    const duration = config.minEventDurationMs + Math.random() * (config.maxEventDurationMs - config.minEventDurationMs);
    const intensity = config.defaultIntensity + (Math.random() - 0.5) * config.intensityVariance * 2;

    events.push(createWorldEvent(
      type, scope, targetIds, startTime, duration, intensity,
      `${currentTime}_${type}`, context
    ));
  }

  return events;
}

function selectScope(playerLevel: number, explorerRank: number): WorldEventScope {
  if (playerLevel >= 30 && explorerRank >= 5) return Math.random() < 0.3 ? 'REGION' : 'AREA';
  if (playerLevel >= 15 && explorerRank >= 3) return Math.random() < 0.5 ? 'AREA' : 'SECTOR';
  return 'SECTOR';
}

function selectTargets(scope: WorldEventScope, seed: string): string[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash) + seed.charCodeAt(i);
  hash = Math.abs(hash);

  const count = scope === 'SECTOR' ? 1 : scope === 'AREA' ? 3 : 5;
  return Array.from({ length: count }, (_, i) => `target_${scope}_${(hash + i * 1000).toString(36)}`);
}

function shuffleArray<T>(array: T[], seed: string): T[] {
  const result = [...array];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash) + seed.charCodeAt(i);
  for (let i = result.length - 1; i > 0; i--) {
    hash = ((hash << 5) - hash) + i;
    const j = Math.abs(hash) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}