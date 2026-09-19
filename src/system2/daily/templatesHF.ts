import type { RunnableQuest } from '../quests/types';
import type { SkillKey } from '../core';
import { deterministicPick } from './calendar';
import { DAILY_HF_CONFIG, pickXPTier, getRandomXPForTier } from './config';

export type ActivityPreferences = { walking: boolean; running: boolean; cycling: boolean };
export const DEFAULT_ACTIVITIES: ActivityPreferences = { walking: true, running: false, cycling: false };

interface DailyQuestTemplate {
  id: string;
  title: string;
  skill: SkillKey;
  category: 'MOVEMENT' | 'EXPLORATION' | 'WORLD' | 'QUESTING' | 'CONSISTENCY' | 'FIELD' | 'DISCOVERY';
  difficulty: 'EASY' | 'NORMAL' | 'HARD';
  minCompletions: number;
  verification: RunnableQuest['verification'];
  activityType?: 'WALK' | 'RUN' | 'BIKE';
  requiresGPS: boolean;
  requiresMotion: boolean;
  requiresWorldUnlocked: boolean;
}

function createDailyTemplate(template: DailyQuestTemplate): RunnableQuest {
  const tier = pickXPTier(0);
  const xp = getRandomXPForTier(tier);
  const skillXp = Math.round(xp * 0.8);
  const energy = Math.max(1, Math.round(xp * 0.1));
  
  const isMovement = template.category === 'MOVEMENT';
  
  // TypeScript narrowing for discriminated union
  const minDistance = template.verification.type === 'GPS_DISTANCE' || template.verification.type === 'MULTI' 
    ? template.verification.minimumDistanceMeters 
    : 0;
  const minDuration = template.verification.type === 'TIMER' || template.verification.type === 'MULTI'
    ? template.verification.minimumDurationSeconds 
    : 0;
  
  return {
    id: template.id,
    title: template.title,
    primarySkill: template.skill,
    secondarySkills: [],
    category: 'DAILY',
    difficulty: template.difficulty,
    order: 0,
    description: isMovement 
      ? `Potwierdź ${minDistance} m aktywności ${template.activityType}. Pomiar GPS działa tylko na pierwszym planie.`
      : `Aktywna sesja ${minDuration / 60} minut. Timer potwierdza czas w SYSTEMIE, nie jakość pracy ani zdobytą wiedzę.`,
    verification: template.verification,
    activityType: template.activityType,
    verificationStrength: 'STANDARD',
    rewards: { realXp: xp, skillXp: { [template.skill]: skillXp }, gameEnergy: energy },
    progress: 0,
    progressTarget: isMovement ? minDistance : minDuration,
    createdAt: '2026-09-18T00:00:00.000Z',
    arc: 'DAILY',
  };
}

const DAILY_QUEST_TEMPLATES: DailyQuestTemplate[] = [
  // MOVEMENT - Micro (2-5 XP)
  { id: 'walk_250', title: 'WALK 250M', skill: 'VIT', category: 'MOVEMENT', difficulty: 'EASY', minCompletions: 0,
    verification: { type: 'GPS_DISTANCE', minimumDistanceMeters: 250, verificationScoreRequired: 70 },
    activityType: 'WALK', requiresGPS: true, requiresMotion: false, requiresWorldUnlocked: false },
  { id: 'walk_500', title: 'WALK 500M', skill: 'VIT', category: 'MOVEMENT', difficulty: 'EASY', minCompletions: 0,
    verification: { type: 'GPS_DISTANCE', minimumDistanceMeters: 500, verificationScoreRequired: 70 },
    activityType: 'WALK', requiresGPS: true, requiresMotion: false, requiresWorldUnlocked: false },
  { id: 'walk_750', title: 'WALK 750M', skill: 'VIT', category: 'MOVEMENT', difficulty: 'EASY', minCompletions: 5,
    verification: { type: 'GPS_DISTANCE', minimumDistanceMeters: 750, verificationScoreRequired: 70 },
    activityType: 'WALK', requiresGPS: true, requiresMotion: false, requiresWorldUnlocked: false },
  { id: 'run_500', title: 'RUN 500M', skill: 'VIT', category: 'MOVEMENT', difficulty: 'NORMAL', minCompletions: 10,
    verification: { type: 'GPS_DISTANCE', minimumDistanceMeters: 500, verificationScoreRequired: 75 },
    activityType: 'RUN', requiresGPS: true, requiresMotion: true, requiresWorldUnlocked: false },
  { id: 'run_1000', title: 'RUN 1KM', skill: 'VIT', category: 'MOVEMENT', difficulty: 'NORMAL', minCompletions: 15,
    verification: { type: 'GPS_DISTANCE', minimumDistanceMeters: 1000, verificationScoreRequired: 75 },
    activityType: 'RUN', requiresGPS: true, requiresMotion: true, requiresWorldUnlocked: false },
  { id: 'bike_2000', title: 'BIKE 2KM', skill: 'VIT', category: 'MOVEMENT', difficulty: 'NORMAL', minCompletions: 20,
    verification: { type: 'GPS_DISTANCE', minimumDistanceMeters: 2000, verificationScoreRequired: 70 },
    activityType: 'BIKE', requiresGPS: true, requiresMotion: true, requiresWorldUnlocked: false },

  // MOVEMENT - Timer based
  { id: 'move_5min', title: 'MOVE 5 MIN', skill: 'VIT', category: 'MOVEMENT', difficulty: 'EASY', minCompletions: 0,
    verification: { type: 'TIMER', minimumDurationSeconds: 300, verificationScoreRequired: 100 },
    requiresGPS: false, requiresMotion: false, requiresWorldUnlocked: false },
  { id: 'move_10min', title: 'MOVE 10 MIN', skill: 'VIT', category: 'MOVEMENT', difficulty: 'NORMAL', minCompletions: 10,
    verification: { type: 'TIMER', minimumDurationSeconds: 600, verificationScoreRequired: 100 },
    requiresGPS: false, requiresMotion: false, requiresWorldUnlocked: false },

  // EXPLORATION
  { id: 'discover_1_sector', title: 'DISCOVER 1 SECTOR', skill: 'RES', category: 'EXPLORATION', difficulty: 'EASY', minCompletions: 0,
    verification: { type: 'GPS_DISTANCE', minimumDistanceMeters: 100, verificationScoreRequired: 70 },
    requiresGPS: true, requiresMotion: false, requiresWorldUnlocked: true },
  { id: 'discover_2_sectors', title: 'DISCOVER 2 SECTORS', skill: 'RES', category: 'EXPLORATION', difficulty: 'NORMAL', minCompletions: 15,
    verification: { type: 'GPS_DISTANCE', minimumDistanceMeters: 1000, verificationScoreRequired: 80 },
    requiresGPS: true, requiresMotion: false, requiresWorldUnlocked: true },
  { id: 'visit_safe_area', title: 'VISIT SAFE AREA', skill: 'RES', category: 'EXPLORATION', difficulty: 'EASY', minCompletions: 5,
    verification: { type: 'GPS_DISTANCE', minimumDistanceMeters: 50, verificationScoreRequired: 85 },
    requiresGPS: true, requiresMotion: false, requiresWorldUnlocked: true },

  // WORLD
  { id: 'signal_investigate', title: 'INVESTIGATE SIGNAL', skill: 'INT', category: 'WORLD', difficulty: 'NORMAL', minCompletions: 10,
    verification: { type: 'GPS_DISTANCE', minimumDistanceMeters: 40, verificationScoreRequired: 90 },
    requiresGPS: true, requiresMotion: false, requiresWorldUnlocked: true },
  { id: 'world_quest_1', title: 'COMPLETE 1 WORLD QUEST', skill: 'RES', category: 'WORLD', difficulty: 'NORMAL', minCompletions: 15,
    verification: { type: 'GPS_DISTANCE', minimumDistanceMeters: 500, verificationScoreRequired: 80 },
    requiresGPS: true, requiresMotion: false, requiresWorldUnlocked: true },

  // QUESTING
  { id: 'complete_1_quest', title: 'COMPLETE 1 QUEST', skill: 'WIL', category: 'QUESTING', difficulty: 'EASY', minCompletions: 0,
    verification: { type: 'MULTI', minimumDistanceMeters: 100, minimumDurationSeconds: 60, verificationScoreRequired: 70 },
    requiresGPS: false, requiresMotion: false, requiresWorldUnlocked: false },
  { id: 'complete_2_quests', title: 'COMPLETE 2 QUESTS', skill: 'WIL', category: 'QUESTING', difficulty: 'NORMAL', minCompletions: 10,
    verification: { type: 'MULTI', minimumDistanceMeters: 200, minimumDurationSeconds: 120, verificationScoreRequired: 75 },
    requiresGPS: false, requiresMotion: false, requiresWorldUnlocked: false },

  // CONSISTENCY
  { id: 'daily_streak_1', title: 'DAILY STREAK 1', skill: 'WIL', category: 'CONSISTENCY', difficulty: 'EASY', minCompletions: 0,
    verification: { type: 'TIMER', minimumDurationSeconds: 60, verificationScoreRequired: 100 },
    requiresGPS: false, requiresMotion: false, requiresWorldUnlocked: false },
  { id: 'consistency_3', title: '3 DAY STREAK', skill: 'WIL', category: 'CONSISTENCY', difficulty: 'EASY', minCompletions: 5,
    verification: { type: 'TIMER', minimumDurationSeconds: 60, verificationScoreRequired: 100 },
    requiresGPS: false, requiresMotion: false, requiresWorldUnlocked: false },

  // FIELD
  { id: 'field_quest_1', title: 'FIELD QUEST', skill: 'VIT', category: 'FIELD', difficulty: 'NORMAL', minCompletions: 20,
    verification: { type: 'GPS_DISTANCE', minimumDistanceMeters: 1000, verificationScoreRequired: 80 },
    activityType: 'WALK', requiresGPS: true, requiresMotion: true, requiresWorldUnlocked: true },

  // DISCOVERY
  { id: 'discover_poi', title: 'DISCOVER POI', skill: 'CRE', category: 'DISCOVERY', difficulty: 'NORMAL', minCompletions: 15,
    verification: { type: 'GPS_DISTANCE', minimumDistanceMeters: 50, verificationScoreRequired: 85 },
    requiresGPS: true, requiresMotion: false, requiresWorldUnlocked: true },
  { id: 'visit_landmark', title: 'VISIT LANDMARK', skill: 'CRE', category: 'DISCOVERY', difficulty: 'EASY', minCompletions: 10,
    verification: { type: 'GPS_DISTANCE', minimumDistanceMeters: 50, verificationScoreRequired: 90 },
    requiresGPS: true, requiresMotion: false, requiresWorldUnlocked: true },
];

function buildDailyTemplates(): RunnableQuest[] {
  return DAILY_QUEST_TEMPLATES.map(t => createDailyTemplate(t));
}

export const DAILY_HF_TEMPLATES = buildDailyTemplates();

export function getDailyTemplates(): RunnableQuest[] {
  return DAILY_HF_TEMPLATES;
}

export function getTemplatesByCategory(category: string): RunnableQuest[] {
  return DAILY_HF_TEMPLATES.filter(t => t.category === category);
}

export function getEligibleTemplates(
  completedCount: number,
  capabilities: { hasGPS: boolean; hasMotion: boolean; worldUnlocked: boolean }
): RunnableQuest[] {
  // Filter templates first, then map to runnable quests
  const eligibleTemplates = DAILY_QUEST_TEMPLATES.filter(t => {
    if (t.minCompletions > completedCount) return false;
    if (t.requiresGPS && !capabilities.hasGPS) return false;
    if (t.requiresMotion && !capabilities.hasMotion) return false;
    if (t.requiresWorldUnlocked && !capabilities.worldUnlocked) return false;
    return true;
  });
  
  return eligibleTemplates.map(t => createDailyTemplate(t));
}

export function getTemplatesByXPTier(tier: string): RunnableQuest[] {
  return DAILY_HF_TEMPLATES.filter(t => {
    const templateTier = pickXPTier(0);
    return templateTier === tier;
  });
}

export function dailyQuest(id: string): RunnableQuest | undefined {
  const match = /^daily:(\d{4}-\d{2}-\d{2}):([a-z0-9_]+)$/.exec(id);
  const t = match && DAILY_QUEST_TEMPLATES.find(q => q.id === match[2]);
  return t ? { ...createDailyTemplate(t), id, templateId: t.id, dayKey: match![1] } : undefined;
}

export function generateDailyHF(
  playerId: string,
  day: string,
  prefs: ActivityPreferences,
  capabilities: { hasGPS: boolean; hasMotion: boolean; worldUnlocked: boolean },
  completedCount: number
): RunnableQuest[] {
  const eligible = getEligibleTemplates(completedCount, capabilities);
  if (eligible.length === 0) return [];
  
  const slots = DAILY_HF_CONFIG.ACTIVE_SLOTS;
  const picked = deterministicPick(eligible, playerId + day, Math.min(slots, eligible.length));
  return picked.map(t => dailyQuest(`daily:${day}:${t.id}`)!);
}

export function refillDailySlot(
  playerId: string,
  day: string,
  prefs: ActivityPreferences,
  capabilities: { hasGPS: boolean; hasMotion: boolean; worldUnlocked: boolean },
  completedCount: number,
  existingIds: string[]
): RunnableQuest | null {
  const eligible = getEligibleTemplates(completedCount, capabilities)
    .filter(t => !existingIds.includes(t.id));
  if (eligible.length === 0) return null;
  
  const picked = deterministicPick(eligible, playerId + day + '_refill' + completedCount, 1);
  return picked[0] ? dailyQuest(`daily:${day}:${picked[0].id}`)! : null;
}

export { DAILY_HF_CONFIG, pickXPTier, getRandomXPForTier } from './config';