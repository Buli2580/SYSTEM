// SYSTEM 2.0 — GAME MASTER CONTEXT
// Builds GameMasterContext from existing SYSTEM state

import type { PlayerProfile, VerifiedEvent, SkillKey, QuestDifficulty, QuestCategory } from '../core/types';
import type { DailyState } from '../storage/daily';
import type { Goal } from '../goals/types';
import type { BossDetailed } from '../storage/database';
import type { GameMasterContext, QuestHistoryEntry, DailyProgressSnapshot, WorldContext, CapabilityFlags, CampaignState } from './types';
import { loadSystemState } from '../storage/database';
import { loadActiveGoals, loadPrimaryGoal } from '../storage/goals';
import { getQuest } from '../quests/catalog';
import * as SQLite from 'expo-sqlite';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync('system2.db').catch((error) => {
      databasePromise = null;
      throw error;
    });
  }
  return databasePromise;
}

export async function buildGameMasterContext(): Promise<GameMasterContext> {
  const snapshot = await loadSystemState();
  const db = await getDatabase();
  const activeGoals = await loadActiveGoals(db);
  const primaryGoal = await loadPrimaryGoal(db);

  const recentQuestHistory = await buildQuestHistory(snapshot.player.id);
  const dailyProgress = buildDailyProgressSnapshot(snapshot.daily, snapshot.completedQuestIds);
  const worldContext = buildWorldContext(snapshot);
  const capabilities = buildCapabilities(snapshot);
  const campaignState = buildCampaignState(snapshot);

  return {
    activeGoals,
    primaryGoal,
    player: snapshot.player,
    recentQuestHistory,
    dailyProgress,
    daily: snapshot.daily,
    streak: snapshot.player.streak,
    worldContext,
    availableCapabilities: capabilities,
    activeCampaignState: campaignState,
    activeBoss: null,
    completedQuestIds: snapshot.completedQuestIds,
    awakeningCompleted: snapshot.awakeningCompleted,
    worldUnlocked: snapshot.worldUnlocked,
  };
}

async function buildQuestHistory(playerId: string): Promise<QuestHistoryEntry[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    quest_id: string;
    payload: string;
  }>(
    `SELECT quest_id, payload FROM verified_events 
     WHERE verified = 1 AND quest_id IS NOT NULL 
     ORDER BY created_at DESC LIMIT 50`
  );

  return rows.map(row => {
    const event = JSON.parse(row.payload) as VerifiedEvent;
    const quest = getQuest(row.quest_id);
    return {
      questId: row.quest_id,
      questTitle: quest?.title ?? 'Unknown Quest',
      completedAt: event.createdAt,
      verificationType: event.verificationType,
      xpAwarded: event.realXpAwarded,
      skillXpAwarded: event.skillXpAwarded as Record<SkillKey, number>,
      difficulty: quest?.difficulty ?? 'NORMAL',
      category: quest?.category ?? 'SIDE',
    };
  });
}

function buildDailyProgressSnapshot(daily: DailyState | null, completedQuestIds: string[]): DailyProgressSnapshot {
  if (!daily) {
    return {
      activeSlots: 0,
      remainingCompletions: 0,
      xpEarnedToday: 0,
      xpBudget: 0,
      completedCount: 0,
      milestonesAchieved: [],
      refillCount: 0,
      dayKey: '',
      isComplete: false,
    };
  }

  const completedToday = daily.questIds.filter(id => completedQuestIds.includes(id));
  const remaining = daily.questIds.filter(id => !completedQuestIds.includes(id));
  const totalXp = daily.questIds.reduce((sum, id) => {
    const quest = getQuest(id);
    return sum + (quest?.rewards.realXp ?? 0);
  }, 0);
  const earnedXp = completedToday.reduce((sum, id) => {
    const quest = getQuest(id);
    return sum + (quest?.rewards.realXp ?? 0);
  }, 0);

  return {
    activeSlots: daily.questIds.length,
    remainingCompletions: remaining.length,
    xpEarnedToday: earnedXp,
    xpBudget: totalXp,
    completedCount: completedToday.length,
    milestonesAchieved: [],
    refillCount: 0,
    dayKey: daily.dayKey,
    isComplete: daily.clear,
  };
}

function buildWorldContext(snapshot: Awaited<ReturnType<typeof loadSystemState>>): WorldContext {
  return {
    currentSector: snapshot.story?.chapters.find(c => c.status === 'ACTIVE')?.id ?? null,
    nearbySignals: 0,
    nearbyCaches: 0,
    nearbyAnomalies: 0,
    nearbyBosses: 0,
    nearbyLandmarks: 0,
    currentArea: null,
    currentRegion: null,
    safetyRating: 'SAFE',
  };
}

function buildCapabilities(snapshot: Awaited<ReturnType<typeof loadSystemState>>): CapabilityFlags {
  return {
    hasGPS: true,
    hasMotion: true,
    hasCamera: true,
    hasMicrophone: true,
    hasInternet: true,
    worldUnlocked: snapshot.worldUnlocked,
  };
}

function buildCampaignState(snapshot: Awaited<ReturnType<typeof loadSystemState>>): CampaignState | null {
  if (!snapshot.awakeningCompleted) {
    return null;
  }
  const activeChapter = snapshot.story?.chapters.find(c => c.status === 'ACTIVE');
  return {
    activeCampaignId: 'main_campaign',
    currentChapter: activeChapter?.number ?? 1,
    currentMission: null,
    completedMissions: snapshot.completedQuestIds,
    completedChapters: snapshot.story?.chapters.filter(c => c.status === 'COMPLETED').map(c => c.id) ?? [],
  };
}