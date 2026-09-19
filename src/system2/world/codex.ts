// SYSTEM 2.0 — WORLD CODEX / COLLECTION
// Collection system for world discoveries

import type { GeoPoint } from '../core';

export type CodexCollectionType =
  | 'SECTORS'
  | 'AREAS'
  | 'REGIONS'
  | 'LANDMARKS'
  | 'CACHES'
  | 'ANOMALIES'
  | 'BOSS_ENCOUNTERS'
  | 'SPECIAL_DISCOVERIES';

export type CodexEntryState = 'UNDISCOVERED' | 'DISCOVERED' | 'COMPLETED' | 'MASTERED';

export interface CodexEntry {
  entryId: string;
  collectionType: CodexCollectionType;
  targetId: string;
  name: string;
  state: CodexEntryState;
  discoveredAt?: string;
  completedAt?: string;
  masteredAt?: string;
  progress: number;
  progressTarget: number;
  metadata: Record<string, unknown>;
  rewards: CodexReward[];
  claimedRewards: string[];
}

export interface CodexReward {
  rewardId: string;
  type: 'REAL_XP' | 'EXPLORATION_XP' | 'SKILL_XP' | 'ITEM' | 'TITLE' | 'COSMETIC';
  value: number | string;
  skillKey?: string;
  claimed: boolean;
  claimedAt?: string;
}

export interface CodexCollection {
  collectionType: CodexCollectionType;
  name: string;
  description: string;
  entries: Map<string, CodexEntry>;
  totalEntries: number;
  discoveredCount: number;
  completedCount: number;
  masteredCount: number;
  totalProgress: number;
  totalProgressTarget: number;
  isComplete: boolean;
  completionPercentage: number;
}

export interface CodexStats {
  totalEntries: number;
  totalDiscovered: number;
  totalCompleted: number;
  totalMastered: number;
  overallCompletionPercentage: number;
  recentDiscoveries: CodexEntry[];
  rareDiscoveries: CodexEntry[];
  collectionHistory: CodexHistoryEntry[];
}

export interface CodexHistoryEntry {
  historyId: string;
  entryId: string;
  collectionType: CodexCollectionType;
  action: 'DISCOVERED' | 'COMPLETED' | 'MASTERED' | 'REWARD_CLAIMED';
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface CodexState {
  collections: Map<CodexCollectionType, CodexCollection>;
  stats: CodexStats;
  lastUpdatedAt: string;
}

export function createCodexCollection(collectionType: CodexCollectionType, name: string, description: string): CodexCollection {
  return {
    collectionType,
    name,
    description,
    entries: new Map(),
    totalEntries: 0,
    discoveredCount: 0,
    completedCount: 0,
    masteredCount: 0,
    totalProgress: 0,
    totalProgressTarget: 0,
    isComplete: false,
    completionPercentage: 0,
  };
}

export function addCodexEntry(collection: CodexCollection, entry: CodexEntry): CodexCollection {
  const newCollection = { ...collection, entries: new Map(collection.entries) };
  newCollection.entries.set(entry.entryId, entry);
  newCollection.totalEntries = newCollection.entries.size;
  recalculateCollectionStats(newCollection);
  return newCollection;
}

export function updateCodexEntry(collection: CodexCollection, entryId: string, updates: Partial<CodexEntry>): CodexCollection {
  const entry = collection.entries.get(entryId);
  if (!entry) return collection;
  const updatedEntry = { ...entry, ...updates, updatedAt: new Date().toISOString() };
  const newCollection = { ...collection, entries: new Map(collection.entries) };
  newCollection.entries.set(entryId, updatedEntry);
  recalculateCollectionStats(newCollection);
  return newCollection;
}

export function discoverCodexEntry(collection: CodexCollection, entryId: string): { collection: CodexCollection; reward: CodexReward[] } {
  const entry = collection.entries.get(entryId);
  if (!entry || entry.state !== 'UNDISCOVERED') return { collection, reward: [] };
  const updatedEntry = {
    ...entry,
    state: 'DISCOVERED' as CodexEntryState,
    discoveredAt: new Date().toISOString(),
    progress: 1,
  };
  const newCollection = { ...collection, entries: new Map(collection.entries) };
  newCollection.entries.set(entryId, updatedEntry);
  recalculateCollectionStats(newCollection);
  return { collection: newCollection, reward: entry.rewards };
}

export function completeCodexEntry(collection: CodexCollection, entryId: string): { collection: CodexCollection; reward: CodexReward[] } {
  const entry = collection.entries.get(entryId);
  if (!entry || entry.state === 'COMPLETED' || entry.state === 'MASTERED') return { collection, reward: [] };
  const updatedEntry = {
    ...entry,
    state: 'COMPLETED' as CodexEntryState,
    completedAt: new Date().toISOString(),
    progress: entry.progressTarget,
  };
  const newCollection = { ...collection, entries: new Map(collection.entries) };
  newCollection.entries.set(entryId, updatedEntry);
  recalculateCollectionStats(newCollection);
  return { collection: newCollection, reward: entry.rewards };
}

export function masterCodexEntry(collection: CodexCollection, entryId: string): { collection: CodexCollection; reward: CodexReward[] } {
  const entry = collection.entries.get(entryId);
  if (!entry || entry.state === 'MASTERED') return { collection, reward: [] };
  const updatedEntry = {
    ...entry,
    state: 'MASTERED' as CodexEntryState,
    masteredAt: new Date().toISOString(),
    progress: entry.progressTarget,
  };
  const newCollection = { ...collection, entries: new Map(collection.entries) };
  newCollection.entries.set(entryId, updatedEntry);
  recalculateCollectionStats(newCollection);
  return { collection: newCollection, reward: entry.rewards };
}

export function claimCodexReward(collection: CodexCollection, entryId: string, rewardId: string): { collection: CodexCollection; reward: CodexReward | null } {
  const entry = collection.entries.get(entryId);
  if (!entry) return { collection, reward: null };
  const reward = entry.rewards.find(r => r.rewardId === rewardId);
  if (!reward || reward.claimed) return { collection, reward: null };
  const updatedReward = { ...reward, claimed: true, claimedAt: new Date().toISOString() };
  const updatedEntry = {
    ...entry,
    rewards: entry.rewards.map(r => r.rewardId === rewardId ? updatedReward : r),
    claimedRewards: [...entry.claimedRewards, rewardId],
  };
  const newCollection = { ...collection, entries: new Map(collection.entries) };
  newCollection.entries.set(entryId, updatedEntry);
  return { collection: newCollection, reward: updatedReward };
}

export function getCodexEntry(collection: CodexCollection, entryId: string): CodexEntry | undefined {
  return collection.entries.get(entryId);
}

export function getCodexEntriesByState(collection: CodexCollection, state: CodexEntryState): CodexEntry[] {
  return Array.from(collection.entries.values()).filter(e => e.state === state);
}

export function getRecentDiscoveries(collections: Map<CodexCollectionType, CodexCollection>, limit = 10): CodexEntry[] {
  const allEntries: CodexEntry[] = [];
  for (const collection of collections.values()) {
    allEntries.push(...Array.from(collection.entries.values()));
  }
  return allEntries
    .filter(e => e.discoveredAt)
    .sort((a, b) => new Date(b.discoveredAt!).getTime() - new Date(a.discoveredAt!).getTime())
    .slice(0, limit);
}

export function getRareDiscoveries(collections: Map<CodexCollectionType, CodexCollection>): CodexEntry[] {
  const allEntries: CodexEntry[] = [];
  for (const collection of collections.values()) {
    allEntries.push(...Array.from(collection.entries.values()));
  }
  return allEntries
    .filter(e => e.metadata.rarity === 'RARE' || e.metadata.rarity === 'EPIC' || e.metadata.rarity === 'LEGENDARY')
    .sort((a, b) => (typeof b.metadata.rarityWeight === 'number' ? b.metadata.rarityWeight : 0) - (typeof a.metadata.rarityWeight === 'number' ? a.metadata.rarityWeight : 0));
}

export function getCollectionHistory(collections: Map<CodexCollectionType, CodexCollection>, limit = 50): CodexHistoryEntry[] {
  const history: CodexHistoryEntry[] = [];
  for (const collection of collections.values()) {
    for (const entry of collection.entries.values()) {
      if (entry.discoveredAt) {
        history.push({ historyId: `hist_${entry.entryId}_discovered`, entryId: entry.entryId, collectionType: collection.collectionType, action: 'DISCOVERED', timestamp: entry.discoveredAt });
      }
      if (entry.completedAt) {
        history.push({ historyId: `hist_${entry.entryId}_completed`, entryId: entry.entryId, collectionType: collection.collectionType, action: 'COMPLETED', timestamp: entry.completedAt });
      }
      if (entry.masteredAt) {
        history.push({ historyId: `hist_${entry.entryId}_mastered`, entryId: entry.entryId, collectionType: collection.collectionType, action: 'MASTERED', timestamp: entry.masteredAt });
      }
      for (const rewardId of entry.claimedRewards) {
        const reward = entry.rewards.find(r => r.rewardId === rewardId);
        if (reward?.claimedAt) {
          history.push({ historyId: `hist_${entry.entryId}_reward_${rewardId}`, entryId: entry.entryId, collectionType: collection.collectionType, action: 'REWARD_CLAIMED', timestamp: reward.claimedAt, metadata: { rewardId } });
        }
      }
    }
  }
  return history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
}

export function calculateCodexStats(collections: Map<CodexCollectionType, CodexCollection>): CodexStats {
  let totalEntries = 0;
  let totalDiscovered = 0;
  let totalCompleted = 0;
  let totalMastered = 0;
  for (const collection of collections.values()) {
    totalEntries += collection.totalEntries;
    totalDiscovered += collection.discoveredCount;
    totalCompleted += collection.completedCount;
    totalMastered += collection.masteredCount;
  }
  return {
    totalEntries,
    totalDiscovered,
    totalCompleted,
    totalMastered,
    overallCompletionPercentage: totalEntries > 0 ? Math.round((totalDiscovered / totalEntries) * 100) : 0,
    recentDiscoveries: getRecentDiscoveries(collections),
    rareDiscoveries: getRareDiscoveries(collections),
    collectionHistory: getCollectionHistory(collections),
  };
}

function recalculateCollectionStats(collection: CodexCollection): void {
  let discovered = 0;
  let completed = 0;
  let mastered = 0;
  let totalProgress = 0;
  let totalProgressTarget = 0;
  for (const entry of collection.entries.values()) {
    if (entry.state === 'DISCOVERED' || entry.state === 'COMPLETED' || entry.state === 'MASTERED') discovered++;
    if (entry.state === 'COMPLETED' || entry.state === 'MASTERED') completed++;
    if (entry.state === 'MASTERED') mastered++;
    totalProgress += entry.progress;
    totalProgressTarget += entry.progressTarget;
  }
  collection.discoveredCount = discovered;
  collection.completedCount = completed;
  collection.masteredCount = mastered;
  collection.totalProgress = totalProgress;
  collection.totalProgressTarget = totalProgressTarget;
  collection.completionPercentage = totalProgressTarget > 0 ? Math.round((totalProgress / totalProgressTarget) * 100) : 0;
  collection.isComplete = collection.totalEntries > 0 && discovered === collection.totalEntries;
}

export const DEFAULT_COLLECTIONS: Array<{ type: CodexCollectionType; name: string; description: string }> = [
  { type: 'SECTORS', name: 'Sectors', description: 'Discovered world sectors' },
  { type: 'AREAS', name: 'Areas', description: 'Explored areas and districts' },
  { type: 'REGIONS', name: 'Regions', description: 'Major region completions' },
  { type: 'LANDMARKS', name: 'Landmarks', description: 'Discovered and visited landmarks' },
  { type: 'CACHES', name: 'Caches', description: 'Found and claimed caches' },
  { type: 'ANOMALIES', name: 'Anomalies', description: 'Investigated anomalies' },
  { type: 'BOSS_ENCOUNTERS', name: 'Boss Encounters', description: 'Defeated world bosses' },
  { type: 'SPECIAL_DISCOVERIES', name: 'Special Discoveries', description: 'Unique world discoveries' },
];

export function createDefaultCodexState(): CodexState {
  const collections = new Map<CodexCollectionType, CodexCollection>();
  for (const { type, name, description } of DEFAULT_COLLECTIONS) {
    collections.set(type, createCodexCollection(type, name, description));
  }
  return {
    collections,
    stats: calculateCodexStats(collections),
    lastUpdatedAt: new Date().toISOString(),
  };
}

export function getCodexCollection(codex: CodexState, type: CodexCollectionType): CodexCollection | undefined {
  return codex.collections.get(type);
}

export function updateCodexCollection(codex: CodexState, type: CodexCollectionType, collection: CodexCollection): CodexState {
  const newCodex = { ...codex, collections: new Map(codex.collections) };
  newCodex.collections.set(type, collection);
  newCodex.stats = calculateCodexStats(newCodex.collections);
  newCodex.lastUpdatedAt = new Date().toISOString();
  return newCodex;
}