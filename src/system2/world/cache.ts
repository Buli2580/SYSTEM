// SYSTEM 2.0 — CACHE / DISCOVERY REWARD SYSTEM
// Cache tiers and reward flow: HIDDEN → DETECTED → DISCOVERED → CLAIMED

import type { GeoPoint } from '../core';
import type { QuestReward, SkillKey } from '../core/types';

export type CacheTier = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC';

export type CacheState = 'HIDDEN' | 'DETECTED' | 'DISCOVERED' | 'CLAIMED' | 'EXPIRED';

export type CacheType = 'STANDARD' | 'RESOURCE' | 'LORE' | 'CHALLENGE' | 'EVENT';

export interface Cache {
  cacheId: string;
  type: CacheType;
  tier: CacheTier;
  state: CacheState;
  coordinates: GeoPoint;
  sectorId: string;
  areaId?: string;
  regionId?: string;
  discoveredAt?: string;
  detectedAt?: string;
  claimedAt?: string;
  expiresAt?: string;
  detectionData: CacheDetectionData;
  rewards: CacheRewards;
  metadata: CacheMetadata;
  deterministicSeed: string;
}

export interface CacheDetectionData {
  signalStrength: number;
  detectionMethod: 'PROXIMITY' | 'SCAN' | 'QUEST' | 'EVENT' | 'EXPLORATION';
  detectedBy?: string;
  detectionQuality: number;
}

export interface CacheRewards {
  realXp: number;
  skillXp: Partial<Record<SkillKey, number>>;
  gameEnergy: number;
  coins?: number;
  items?: CacheItem[];
  cacheEssence: number;
}

export interface CacheItem {
  itemId: string;
  type: 'CONSUMABLE' | 'COSMETIC' | 'MATERIAL' | 'KEY' | 'LORE';
  name: string;
  description: string;
  rarity: CacheTier;
  quantity: number;
  metadata?: Record<string, unknown>;
}

export interface CacheMetadata {
  context: string;
  timeOfDay: string;
  weatherConditions?: string;
  terrainType?: string;
  playerLevelAtSpawn: number;
  explorerRankAtSpawn: number;
  isEventCache: boolean;
  eventId?: string;
}

export interface CacheConfig {
  detectionRadius: Record<CacheTier, number>;
  claimRadius: Record<CacheTier, number>;
  baseRewards: Record<CacheTier, CacheRewards>;
  typeModifiers: Record<CacheType, Partial<CacheRewards>>;
  expirationMs: Record<CacheTier, number>;
  cooldownMs: number;
  maxConcurrentPerSector: Record<CacheTier, number>;
}

export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  detectionRadius: {
    COMMON: 80,
    UNCOMMON: 100,
    RARE: 150,
    EPIC: 200,
  },
  claimRadius: {
    COMMON: 20,
    UNCOMMON: 25,
    RARE: 30,
    EPIC: 40,
  },
  baseRewards: {
    COMMON: { realXp: 100, skillXp: { CRE: 50 }, gameEnergy: 10, cacheEssence: 5 },
    UNCOMMON: { realXp: 200, skillXp: { CRE: 100, RES: 50 }, gameEnergy: 15, cacheEssence: 10, coins: 25 },
    RARE: { realXp: 400, skillXp: { CRE: 200, INT: 100 }, gameEnergy: 25, cacheEssence: 20, coins: 75 },
    EPIC: { realXp: 800, skillXp: { CRE: 300, INT: 150, WIL: 100 }, gameEnergy: 50, cacheEssence: 50, coins: 200 },
  },
  typeModifiers: {
    STANDARD: {},
    RESOURCE: { coins: 50, cacheEssence: 10 },
    LORE: { realXp: 100, skillXp: { INT: 50 } },
    CHALLENGE: { realXp: 200, skillXp: { VIT: 100 }, gameEnergy: 20 },
    EVENT: { realXp: 300, coins: 100, cacheEssence: 20 },
  },
  expirationMs: {
    COMMON: 24 * 60 * 60 * 1000,
    UNCOMMON: 48 * 60 * 60 * 1000,
    RARE: 72 * 60 * 60 * 1000,
    EPIC: 7 * 24 * 60 * 60 * 1000,
  },
  cooldownMs: 60 * 60 * 1000,
  maxConcurrentPerSector: {
    COMMON: 3,
    UNCOMMON: 2,
    RARE: 1,
    EPIC: 1,
  },
};

export function createCache(
  type: CacheType,
  tier: CacheTier,
  coordinates: GeoPoint,
  sectorId: string,
  areaId: string | undefined,
  regionId: string | undefined,
  seed: string,
  playerLevel: number,
  explorerRank: number,
  isEventCache = false,
  eventId?: string
): Cache {
  const now = Date.now();
  const expiresAt = new Date(now + DEFAULT_CACHE_CONFIG.expirationMs[tier]).toISOString();

  return {
    cacheId: `cache_${type.toLowerCase()}_${tier.toLowerCase()}_${now}_${seed.slice(0, 8)}`,
    type,
    tier,
    state: 'HIDDEN',
    coordinates,
    sectorId,
    areaId,
    regionId,
    detectionData: {
      signalStrength: 0,
      detectionMethod: 'PROXIMITY',
      detectionQuality: 0,
    },
    rewards: calculateCacheRewards(type, tier, playerLevel),
    metadata: {
      context: '',
      timeOfDay: getTimeOfDay(),
      playerLevelAtSpawn: playerLevel,
      explorerRankAtSpawn: explorerRank,
      isEventCache,
      eventId,
    },
    deterministicSeed: seed,
    expiresAt,
  };
}

function calculateCacheRewards(type: CacheType, tier: CacheTier, playerLevel: number): CacheRewards {
  const base = DEFAULT_CACHE_CONFIG.baseRewards[tier];
  const modifier = DEFAULT_CACHE_CONFIG.typeModifiers[type];
  const levelMult = 1 + playerLevel * 0.03;

  const rewards: CacheRewards = {
    realXp: Math.round((base.realXp + (modifier.realXp || 0)) * levelMult),
    skillXp: {} as Partial<Record<SkillKey, number>>,
    gameEnergy: Math.round((base.gameEnergy + (modifier.gameEnergy || 0)) * levelMult),
    cacheEssence: Math.round((base.cacheEssence + (modifier.cacheEssence || 0)) * levelMult),
  };

  for (const [skill, value] of Object.entries(base.skillXp)) {
    rewards.skillXp[skill as SkillKey] = Math.round((value + (modifier.skillXp?.[skill as SkillKey] || 0)) * levelMult);
  }

  if (modifier.coins) rewards.coins = Math.round((base.coins || 0 + modifier.coins) * levelMult);
  else if (base.coins) rewards.coins = Math.round(base.coins * levelMult);

  if (tier === 'RARE' || tier === 'EPIC') {
    rewards.items = generateCacheItems(type, tier);
  }

  return rewards;
}

function generateCacheItems(type: CacheType, tier: CacheTier): CacheItem[] {
  const items: CacheItem[] = [];
  const count = tier === 'EPIC' ? 2 : 1;

  for (let i = 0; i < count; i++) {
    const itemTypes: CacheItem['type'][] = ['CONSUMABLE', 'MATERIAL', 'COSMETIC', 'LORE'];
    const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];

    items.push({
      itemId: `cache_item_${type.toLowerCase()}_${tier.toLowerCase()}_${Date.now()}_${i}`,
      type: itemType,
      name: getCacheItemName(type, tier, itemType),
      description: getCacheItemDescription(type, tier, itemType),
      rarity: tier,
      quantity: 1,
    });
  }

  return items;
}

function getCacheItemName(type: CacheType, tier: CacheTier, itemType: CacheItem['type']): string {
  const names: Record<CacheItem['type'], Record<CacheTier, string>> = {
    CONSUMABLE: { COMMON: 'Energy Drink', UNCOMMON: 'Power Serum', RARE: 'Essence Vial', EPIC: 'Ambrosia' },
    MATERIAL: { COMMON: 'Scrap Metal', UNCOMMON: 'Refined Alloy', RARE: 'Exotic Matter', EPIC: 'Chronon Crystal' },
    COSMETIC: { COMMON: 'Basic Badge', UNCOMMON: 'Explorer Pin', RARE: 'Veteran Medal', EPIC: 'Legendary Emblem' },
    LORE: { COMMON: 'Field Note', UNCOMMON: 'Data Fragment', RARE: 'Ancient Tablet', EPIC: 'Forbidden Codex' },
    KEY: { COMMON: 'Rusty Key', UNCOMMON: 'Silver Key', RARE: 'Golden Key', EPIC: 'Master Key' },
  };
  return names[itemType]?.[tier] || 'Unknown Item';
}

function getCacheItemDescription(type: CacheType, tier: CacheTier, itemType: CacheItem['type']): string {
  return `A ${tier.toLowerCase()} ${itemType.toLowerCase()} found in a ${type.toLowerCase()} cache.`;
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'MORNING';
  if (hour >= 12 && hour < 17) return 'AFTERNOON';
  if (hour >= 17 && hour < 21) return 'EVENING';
  return 'NIGHT';
}

export function detectCache(cache: Cache, playerLocation: GeoPoint, method: CacheDetectionData['detectionMethod']): Cache {
  if (cache.state !== 'HIDDEN') return cache;
  if (!isInDetectionRange(cache, playerLocation)) return cache;

  const signalStrength = calculateSignalStrength(cache, playerLocation);
  const quality = signalStrength / 100;

  return {
    ...cache,
    state: 'DETECTED',
    detectedAt: new Date().toISOString(),
    detectionData: {
      signalStrength,
      detectionMethod: method,
      detectionQuality: quality,
    },
  };
}

function isInDetectionRange(cache: Cache, playerLocation: GeoPoint): boolean {
  const { haversineDistance } = require('./proximity');
  const radius = DEFAULT_CACHE_CONFIG.detectionRadius[cache.tier];
  return haversineDistance(playerLocation, cache.coordinates) <= radius;
}

function calculateSignalStrength(cache: Cache, playerLocation: GeoPoint): number {
  const { haversineDistance } = require('./proximity');
  const distance = haversineDistance(playerLocation, cache.coordinates);
  const maxRadius = DEFAULT_CACHE_CONFIG.detectionRadius[cache.tier];
  return Math.max(0, Math.round((1 - distance / maxRadius) * 100));
}

export function discoverCache(cache: Cache, playerLocation: GeoPoint): Cache {
  if (cache.state !== 'DETECTED') return cache;
  if (!isInClaimRange(cache, playerLocation)) return cache;

  return {
    ...cache,
    state: 'DISCOVERED',
    discoveredAt: new Date().toISOString(),
  };
}

function isInClaimRange(cache: Cache, playerLocation: GeoPoint): boolean {
  const { haversineDistance } = require('./proximity');
  const radius = DEFAULT_CACHE_CONFIG.claimRadius[cache.tier];
  return haversineDistance(playerLocation, cache.coordinates) <= radius;
}

export function claimCache(cache: Cache): { cache: Cache; rewards: CacheRewards } | null {
  if (cache.state !== 'DISCOVERED') return null;
  if (isCacheExpired(cache)) return null;

  const claimedCache: Cache = {
    ...cache,
    state: 'CLAIMED',
    claimedAt: new Date().toISOString(),
  };

  return { cache: claimedCache, rewards: cache.rewards };
}

export function isCacheExpired(cache: Cache, now = Date.now()): boolean {
  if (cache.state === 'CLAIMED' || cache.state === 'EXPIRED') return true;
  if (!cache.expiresAt) return false;
  return new Date(cache.expiresAt).getTime() < now;
}

export function expireCache(cache: Cache): Cache {
  if (cache.state === 'CLAIMED' || cache.state === 'EXPIRED') return cache;
  return { ...cache, state: 'EXPIRED', expiresAt: new Date().toISOString() };
}

export function canSpawnCacheInSector(
  sectorCaches: Cache[],
  tier: CacheTier,
  config: CacheConfig = DEFAULT_CACHE_CONFIG
): boolean {
  const existingOfTier = sectorCaches.filter(c => c.tier === tier && c.state !== 'CLAIMED' && c.state !== 'EXPIRED').length;
  return existingOfTier < config.maxConcurrentPerSector[tier];
}

export function getCacheProgress(cache: Cache): number {
  switch (cache.state) {
    case 'HIDDEN': return 0;
    case 'DETECTED': return 25;
    case 'DISCOVERED': return 75;
    case 'CLAIMED': return 100;
    case 'EXPIRED': return 0;
    default: return 0;
  }
}

export function getCacheDifficulty(tier: CacheTier): 'EASY' | 'NORMAL' | 'HARD' | 'ELITE' {
  const difficulties: Record<CacheTier, 'EASY' | 'NORMAL' | 'HARD' | 'ELITE'> = {
    COMMON: 'EASY',
    UNCOMMON: 'NORMAL',
    RARE: 'HARD',
    EPIC: 'ELITE',
  };
  return difficulties[tier];
}

export function getCacheDescription(tier: CacheTier, type: CacheType): string {
  const descriptions: Record<CacheTier, Record<CacheType, string>> = {
    COMMON: {
      STANDARD: 'A small hidden container with basic supplies.',
      RESOURCE: 'A resource cache with common materials.',
      LORE: 'A weathered note with local information.',
      CHALLENGE: 'A simple challenge marker.',
      EVENT: 'An event marker with a small reward.',
    },
    UNCOMMON: {
      STANDARD: 'A well-concealed cache with useful items.',
      RESOURCE: 'A resource stash with refined materials.',
      LORE: 'A data fragment containing regional lore.',
      CHALLENGE: 'A moderate challenge with decent rewards.',
      EVENT: 'An event cache with bonus rewards.',
    },
    RARE: {
      STANDARD: 'A carefully hidden cache with valuable contents.',
      RESOURCE: 'A rare resource deposit with exotic materials.',
      LORE: 'An ancient tablet with forgotten knowledge.',
      CHALLENGE: 'A difficult challenge for experienced explorers.',
      EVENT: 'A special event cache with unique rewards.',
    },
    EPIC: {
      STANDARD: 'A legendary cache with extraordinary treasures.',
      RESOURCE: 'A mythical resource vein with chronon crystals.',
      LORE: 'A forbidden codex with dangerous secrets.',
      CHALLENGE: 'An elite challenge for the most skilled.',
      EVENT: 'A once-in-a-lifetime event cache.',
    },
  };
  return descriptions[tier]?.[type] || 'A mysterious cache.';
}

export function getCacheIcon(tier: CacheTier): string {
  const icons: Record<CacheTier, string> = {
    COMMON: '📦',
    UNCOMMON: '🎁',
    RARE: '💎',
    EPIC: '🏆',
  };
  return icons[tier];
}