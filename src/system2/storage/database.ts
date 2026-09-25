import { readGoals, insertGoal, changeGoalStatus } from './goals';
import type { PlayerGoal, GoalInput, GoalStatus } from '../goals/model';
import type { Journey } from '../journeys/model';
import type { RecentActivity } from '../generation/engine';
import { ensureJourneys, bindJourneyQuests, journeyBindings, advanceJourney } from './journeys';
import { generationInput, persistCandidate } from './generation';
import { generateLoadout } from '../generation/engine';
import { templateFor } from '../generation/templates';
import { applyProgression, readProgression, type ProgressionState } from './progression';
import { ensureAchievementSchema } from '../achievements/schema';
import { validateBirthDate } from '../identity/age';
import { inspectLocalHealth, type LocalHealth } from './health';
import { createQuestCompletion } from '../application/completeQuest';
import { localQuestVerification } from '../verification/localProvider';
import { questAvailability } from '../quests/availability';
import { completionRepositories } from './completionRepositories';
import { reconcileStory, completeStoryActivity, bossAccess, storyEvent } from './story';
import { BOSS_ID, attemptKind } from '../story/catalog';
import type { StoryState, StoryEvent, QuestAttempt, AttemptResult, AttemptReason } from '../story/types';
import { dayKey } from '../daily/calendar';
import { classifyActivity } from '../activity/classifier';
import type { ActivityEvidence, ActivityFeatures } from '../activity/types';
import { dailyState, ensureDailyAccess, awardProtocols, currentStreak, type DailyState } from './daily';
import { DEFAULT_ACTIVITIES } from '../daily/templates';
import { getQuest } from '../quests/catalog';
import * as SQLite from 'expo-sqlite';
import { migrateDatabase } from './migrations';
import { normalizePlayer } from '../core/progression';
import { DEFAULT_SETTINGS, earnedTitles, systemName, parseSettings, mergeSettings, type Settings, type SettingsPatch, type Title } from '../identity/model';
import { rewardReceipt, type RewardReceipt } from '../core/rewards';
import type { AIGameMasterResponse } from '../ai/types';
import { candidatesFromAI } from '../ai/bridge';
import { replaceAIQuestPresentations } from '../ai/registry';
import { clearAIConsequenceDebt, readAIConsequenceState } from './aiState';
import { parseEvent } from '../identity/history';
import { bossPhaseState } from '../story/bossEngine';
import { createMoveState, rolloverMoveState, completeMoveQuest as reduceMoveQuest, type MoveCompletionEvidence, type MoveState } from '../move/state';
import { moveAgeMode } from '../move/age';
import { MOVEMENT_SKILLS } from '../move/skills';

import {
  createNewPlayer,
  type PlayerProfile, type VerifiedEvent,
} from '../core';
import { getQuestStatus, prerequisitesCompleted } from '../quests/catalog';
import type { QuestEvidence } from '../quests/types';
import { awardAwakeningIfEligible } from './chapter';

export type CompleteQuestInput = QuestEvidence & { operationKey?: string };
export type QuestCheckpoint = {
  questId: string;
  distanceMeters: number;
  durationSeconds: number;
  verificationScore: number;
  extendedGoal: boolean;
  activityFeatures?: ActivityFeatures;
  updatedAt: string;
};

export type StoredLocationPoint = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  mocked: boolean;
};

export type BackgroundQuestSession = {
  questId: string;
  attemptId: string;
  mode: 'FOREGROUND' | 'BACKGROUND';
  extendedGoal: boolean;
  lastPoint?: StoredLocationPoint;
  lastObservedTimestamp?: number;
  updatedAt: string;
};
export type AIDailyCache = {
  dayKey: string;
  source: 'ai';
  model?: string;
  briefing: string;
  director: AIGameMasterResponse['director'];
  research?: AIGameMasterResponse['research'];
  memory?: AIGameMasterResponse['memory'];
  generatedAt: string;
};

export type SystemSnapshot = {
  systemDebt: 0 | 1 | 2 | 3;
  aiDaily?: AIDailyCache | null;
  goals: PlayerGoal[]; journeys: Journey[]; journeyQuestIds: Record<string,string>; recentActivity: readonly RecentActivity[]; progression: ProgressionState | null;
  failedQuestIds?: string[];
  story: StoryState | null;
  daily: DailyState | null;
  player: PlayerProfile;
  completedQuestIds: string[];
  awakeningCompleted: boolean;
  worldUnlocked: boolean;
  awakeningPending: boolean;
  onboardingComplete: boolean;
  settings: Settings;
  titles: Title[];
};
export type CompleteQuestResult = SystemSnapshot & { awarded: boolean; awakeningAwarded: boolean; receipt?: RewardReceipt };

const PENDING_REWARD_PRESENTATIONS_KEY = 'pending_reward_presentations';

function validRewardReceipt(value: unknown): value is RewardReceipt {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<RewardReceipt>;
  const rewards = [row.realXp,row.energy,row.distanceMeters];
  const skillXp = row.skillXp;
  const skillLevels = row.skillLevels;
  const newTitles = row.newTitles;
  const ranks = ['E','D','C','B','A','S','SS','SSS','ASCENDED'];
  const skills = ['STR','VIT','INT','WIL','CHA','CRE','RES'];
  const titles = ['UNAWAKENED','AWAKENED','SIGNAL HUNTER','PATHFINDER','WALLBREAKER'];
  return typeof row.id === 'string' && row.id.length > 0 && row.id.length <= 220
    && rewards.every(item => typeof item === 'number' && Number.isFinite(item) && item >= 0)
    && Number.isSafeInteger(row.beforeLevel) && Number(row.beforeLevel) >= 1
    && Number.isSafeInteger(row.afterLevel) && Number(row.afterLevel) >= Number(row.beforeLevel)
    && typeof row.beforeRank === 'string' && ranks.includes(row.beforeRank)
    && typeof row.afterRank === 'string' && ranks.includes(row.afterRank)
    && !!skillXp && typeof skillXp === 'object' && !Array.isArray(skillXp)
    && Object.entries(skillXp).every(([key,xp]) =>
      skills.includes(key) && typeof xp === 'number' && Number.isSafeInteger(xp) && xp >= 0)
    && Array.isArray(skillLevels) && skillLevels.every(item => {
      if (!item || typeof item !== 'object') return false;
      const candidate = item as {key?:unknown;before?:unknown;after?:unknown};
      return skills.includes(String(candidate.key))
        && typeof candidate.before === 'number' && Number.isSafeInteger(candidate.before) && candidate.before >= 1
        && typeof candidate.after === 'number' && Number.isSafeInteger(candidate.after) && candidate.after > candidate.before;
    })
    && Array.isArray(newTitles) && newTitles.every(title => typeof title === 'string' && titles.includes(title))
    && typeof row.worldUnlocked === 'boolean'
    && (row.bossDamage === undefined || (
      !!row.bossDamage && typeof row.bossDamage === 'object'
      && ['beforeHp','afterHp','dealt'].every(key => {
        const value = (row.bossDamage as Record<string, unknown>)[key];
        return typeof value === 'number' && Number.isFinite(value) && value >= 0;
      })
      && typeof (row.bossDamage as Record<string, unknown>).phaseBefore === 'string'
      && typeof (row.bossDamage as Record<string, unknown>).phaseAfter === 'string'
    ));
}

function parsePendingRewardPresentations(raw?: string): RewardReceipt[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    return parsed.filter(validRewardReceipt).filter(receipt => {
      if (seen.has(receipt.id)) return false;
      seen.add(receipt.id);
      return true;
    }).slice(-16);
  } catch {
    return [];
  }
}

export async function enqueuePendingRewardPresentation(txn: SQLite.SQLiteDatabase, receipt: RewardReceipt) {
  const row = await txn.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_state WHERE key=?', PENDING_REWARD_PRESENTATIONS_KEY
  );
  const queue = parsePendingRewardPresentations(row?.value).filter(item => item.id !== receipt.id);
  queue.push(receipt);
  await txn.runAsync(
    'INSERT INTO app_state(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
    PENDING_REWARD_PRESENTATIONS_KEY, JSON.stringify(queue.slice(-16))
  );
}

async function completedQuestIds(db: SQLite.SQLiteDatabase): Promise<string[]> {
  const rows = await db.getAllAsync<{ quest_id: string }>('SELECT quest_id FROM quest_completions');
  return rows.map(row => row.quest_id);
}

function validAIDirector(value: unknown): value is AIGameMasterResponse['director'] {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return ['normal','recovery','challenge'].includes(String(row.mode)) &&
    [-1,0,1].includes(Number(row.difficultyBias)) &&
    typeof row.headline === 'string' && row.headline.length <= 80 &&
    typeof row.message === 'string' && row.message.length <= 220;
}

async function readAIDailyCache(db: SQLite.SQLiteDatabase, day: string): Promise<AIDailyCache | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_state WHERE key=?',
    'ai_daily_applied:' + day,
  );
  if (!row) return null;
  try {
    const parsed = JSON.parse(row.value) as Record<string, unknown>;
    if (parsed.source !== 'ai') return null;
    const director = validAIDirector(parsed.director)
      ? parsed.director
      : {
          mode: 'normal' as const,
          difficultyBias: 0 as const,
          headline: 'DAILY DIRECTIVE',
          message: 'SYSTEM korzysta z zapisanej dziennej konfiguracji AI.',
        };
    return {
      dayKey: day,
      source: 'ai',
      ...(typeof parsed.model === 'string' && parsed.model.length <= 120 ? { model: parsed.model } : {}),
      briefing: typeof parsed.briefing === 'string' ? parsed.briefing.slice(0, 180) : '',
      director,
      ...(parsed.research && typeof parsed.research === 'object' ? { research: parsed.research as AIGameMasterResponse['research'] } : {}),
      ...(parsed.memory && typeof parsed.memory === 'object' ? { memory: parsed.memory as AIGameMasterResponse['memory'] } : {}),
      generatedAt: typeof parsed.generatedAt === 'string' ? parsed.generatedAt : '',
    };
  } catch {
    return null;
  }
}

async function hydrateAIQuestPresentations(db: SQLite.SQLiteDatabase) {
  const rows = await db.getAllAsync<{ value: string }>(
    "SELECT value FROM app_state WHERE key LIKE 'ai_daily_presentation:%' ORDER BY key DESC LIMIT 14"
  );
  const presentations: { id: string; title: string; description: string }[] = [];
  for (const row of rows.reverse()) {
    try {
      const parsed = JSON.parse(row.value) as { quests?: unknown };
      if (!Array.isArray(parsed.quests)) continue;
      for (const item of parsed.quests) {
        if (!item || typeof item !== 'object') continue;
        const quest = item as Record<string, unknown>;
        if (typeof quest.id !== 'string' || typeof quest.title !== 'string' || typeof quest.description !== 'string') continue;
        presentations.push({ id: quest.id, title: quest.title, description: quest.description });
      }
    } catch {
      // Presentation copy is non-authoritative; corrupt rows fall back to canonical quest copy.
    }
  }
  replaceAIQuestPresentations(presentations);
}

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;
let initializationPromise: Promise<void> | null = null;
let operations: Promise<unknown> = Promise.resolve();

// All SYSTEM writes share a queue. SQL uniqueness remains the final guard,
// including for another connection; a failed operation does not poison the queue.
function serialized<T>(task: () => Promise<T>): Promise<T> {
  const result = operations.then(task);
  operations = result.catch(() => undefined);
  return result;
}

function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync('system2.db').catch(error => {
      databasePromise = null;
      throw error;
    });
  }
  return databasePromise;
}

export async function initSystemDatabase() {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      const db = await getDatabase();
      await migrateDatabase(db);
      await db.withExclusiveTransactionAsync(async txn => {
        // Older builds could commit a quest without closing its attempt row.
        // Reconcile those rows from the canonical completion record before
        // treating genuinely unfinished attempts as abandoned.
        await txn.runAsync(
          `UPDATE quest_attempts
           SET result='COMPLETED',
               reason=NULL,
               ended_at=COALESCE(
                 (SELECT c.completed_at FROM quest_completions c WHERE c.quest_id=quest_attempts.quest_id),
                 ended_at,
                 ?
               ),
               eligible=0
           WHERE result IS NULL
             AND quest_id IN (SELECT quest_id FROM quest_completions)`,
          new Date(Date.now()).toISOString(),
        );
        const activeRow = await txn.getFirstAsync<{ value: string }>(
          'SELECT value FROM app_state WHERE key=?',
          BACKGROUND_QUEST_SESSION_KEY,
        );
        const activeBackground = parseBackgroundQuestSession(activeRow?.value);
        if (activeBackground?.attemptId) {
          await txn.runAsync(
            "UPDATE quest_attempts SET result='ABANDONED',reason='PROCESS_ENDED',ended_at=? WHERE result IS NULL AND attempt_id<>?",
            new Date(Date.now()).toISOString(),
            activeBackground.attemptId,
          );
        } else {
          await txn.runAsync(
            "UPDATE quest_attempts SET result='ABANDONED',reason='PROCESS_ENDED',ended_at=? WHERE result IS NULL",
            new Date(Date.now()).toISOString(),
          );
        }
      });
    })().catch(error => {
      initializationPromise = null;
      throw error;
    });
  }
  await initializationPromise;
}

async function readPlayer(db: SQLite.SQLiteDatabase): Promise<PlayerProfile> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_state WHERE key = ?', 'player'
  );
  if (!row) throw new Error('Nie znaleziono profilu SYSTEMU. Wróć na ekran główny.');
  const player = normalizePlayer(JSON.parse(row.value));
  if (JSON.stringify(player) !== row.value) await db.runAsync('UPDATE app_state SET value = ? WHERE key = ?', JSON.stringify(player), 'player');
  return player;
}

export function loadOrCreatePlayer(): Promise<PlayerProfile> {
  return loadSystemState().then(snapshot => snapshot.player);
}

export function isQuestCompleted(questId: string): Promise<boolean> {
  return serialized(async () => {
    await initSystemDatabase();
    const db = await getDatabase();
    return Boolean(await db.getFirstAsync(
      'SELECT quest_id FROM quest_completions WHERE quest_id = ?', questId
    ));
  });
}

export function getQuestAccess(questId: string): Promise<ReturnType<typeof getQuestStatus>> {
  return serialized(async () => {
    await initSystemDatabase();
    const db = await getDatabase();
    let access: ReturnType<typeof getQuestStatus> = 'LOCKED';
    await db.withExclusiveTransactionAsync(async txn => {
      await txn.runAsync('UPDATE app_state SET value=value WHERE key=?', 'player');
      const snapshot = await snapshotInTransaction(txn);
      const resolved = questAvailability(questId, { completedQuestIds: snapshot.completedQuestIds, daily: snapshot.daily,
        bossAccessible: getQuest(questId)?.category === 'BOSS' ? await bossAccess(txn, questId) : false });
      access = resolved.status === 'FAILED' ? 'AVAILABLE' : resolved.status;
    });
    return access;
  });
}

async function snapshotInTransaction(db: SQLite.SQLiteDatabase) {
  await hydrateAIQuestPresentations(db);
  const ids = await completedQuestIds(db);
  const chapter = await awardAwakeningIfEligible(db, await readPlayer(db), ids);
  const seen = await db.getFirstAsync('SELECT value FROM app_state WHERE key = ?', 'awakening_presentation_seen');
  // Sector rows are the sole source of truth; the profile count is a projection.
  const sectors = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM discovered_sectors');
  const onboarding = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_state WHERE key = ?', 'onboarding_complete');
  const settings = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_state WHERE key = ?', 'settings');
  const signal = await db.getFirstAsync('SELECT id FROM verified_events WHERE id = ?', 'first_world_signal_v1');
  const reconciled = await reconcileStory(db, chapter.player, ids);
  chapter.player = reconciled.player;
  const titles = earnedTitles(chapter.awakeningCompleted, Boolean(signal), reconciled.story.worldLinkComplete, reconciled.story.bossComplete);
  const selected = titles.includes(chapter.player.currentTitle as Title) ? chapter.player.currentTitle : titles[titles.length - 1];
  const preferences = parseSettings(settings?.value);
  const goals = await readGoals(db);
  const journeys = await ensureJourneys(db, goals);
  const daily = await dailyState(db, chapter.player, chapter.awakeningCompleted, preferences.activities ?? DEFAULT_ACTIVITIES);
  if (daily) await bindJourneyQuests(db, daily.questIds, goals, journeys);
  const recentActivity = (await generationInput(db, chapter.player, daily?.dayKey ?? dayKey(), preferences.activities ?? DEFAULT_ACTIVITIES)).history;
  const progression = await readProgression(db, new Date(Date.now()).toISOString());
  const consequence = await readAIConsequenceState(db);
  const aiDaily = daily ? await readAIDailyCache(db, daily.dayKey) : null;
  if (daily) chapter.player.streak = await currentStreak(db, daily.dayKey, chapter.player.streak);
  const failed = await db.getAllAsync<{ quest_id: string }>("SELECT DISTINCT quest_id FROM quest_attempts WHERE result IN ('FAILED','REJECTED','INTERRUPTED','SUSPICIOUS') AND quest_id NOT IN (SELECT quest_id FROM quest_completions)");
  return {
    systemDebt: consequence.systemDebt, aiDaily, goals, journeys, journeyQuestIds: await journeyBindings(db), recentActivity, progression,
    failedQuestIds: failed.map(row => row.quest_id), daily, story: reconciled.story,
    onboardingComplete: onboarding?.value === 'true', settings: parseSettings(settings?.value), titles,
    ...chapter, player: { ...chapter.player, currentTitle: selected, discoveredSectors: sectors?.count ?? 0 },
    completedQuestIds: ids, worldUnlocked: chapter.awakeningCompleted,
    awakeningPending: chapter.awakeningCompleted && !seen,
  };
}

// World mutations share the quest queue and the same SQLite exclusive transaction.
// Acquire the write lock before reading unlock state/profile to avoid stale rewards.
export function worldTransaction<T>(task: (txn: SQLite.SQLiteDatabase, player: PlayerProfile) => Promise<T>): Promise<T> {
  return serialized(async () => {
    await initSystemDatabase();
    const db = await getDatabase();
    let result: T;
    await db.withExclusiveTransactionAsync(async txn => {
      await txn.runAsync('UPDATE app_state SET value = value WHERE key = ?', 'player');
      const snapshot = await snapshotInTransaction(txn);
      if (!snapshot.worldUnlocked) throw new Error('Complete Awakening to unlock SYSTEM WORLD.');
      result = await task(txn, snapshot.player);
      await reconcileStory(txn, await readPlayer(txn), await completedQuestIds(txn));
    });
    return result!;
  });
}

// Compatibility facade: Provider/UI continue to call the same API.
const completeQuestUseCase = createQuestCompletion<CompleteQuestResult>({
  run: work => serialized(async () => {
    await initSystemDatabase();
    const db = await getDatabase();
    let result: Awaited<ReturnType<typeof work>>;
    await db.withExclusiveTransactionAsync(async txn => {
      // Lock before reads; uniqueness on completion/event remains the final duplicate guard.
      await txn.runAsync('UPDATE app_state SET value = value WHERE key = ?', 'player');
      const presentationBefore = await snapshotInTransaction(txn);
      result = await work(completionRepositories(txn, () => readPlayer(txn), async id => {
        const quest = getQuest(id);
        const ids = await completedQuestIds(txn);
        const daily = quest?.category === 'DAILY' ? (await snapshotInTransaction(txn)).daily : null;
        return questAvailability(id, { completedQuestIds: ids, daily,
          bossAccessible: quest?.category === 'BOSS' ? await bossAccess(txn, id) : false });
      }, {
        async apply(player, quest, evidence, now) {
          // completeStoryActivity owns attempt validation + closure because it
          // also derives rematch/hidden-story rewards from the still-open attempt.
          const storyPlayer = await completeStoryActivity(txn, player, quest, evidence);
          const journeyPlayer = await advanceJourney(txn, storyPlayer, quest, now);
          const protocolPlayer = await awardProtocols(txn, journeyPlayer, quest.id, now);
          if (templateFor(quest.id)?.id === 'focus_return') await clearAIConsequenceDebt(txn);
          return applyProgression(txn, protocolPlayer, quest, evidence, 'quest_' + quest.id, now);
        },
        async result(awarded, before, event) {
          if (awarded && event) await enqueueCloudOutboxEvent(txn, event);
          const snapshot = await snapshotInTransaction(txn);
          const beforeHp = presentationBefore.story?.bossHp;
          const afterHp = snapshot.story?.bossHp;
          const hasBossDelta = typeof beforeHp === 'number' && typeof afterHp === 'number' && afterHp < beforeHp;
          const bossDamage = hasBossDelta ? {
            beforeHp,
            afterHp,
            dealt: Math.max(0, beforeHp - afterHp),
            phaseBefore: bossPhaseState(beforeHp, 100, Date.now(), presentationBefore.story?.boss?.started_at).phase,
            phaseAfter: bossPhaseState(afterHp, 100, Date.now(), snapshot.story?.boss?.started_at).phase,
          } : undefined;
          const receipt = event ? rewardReceipt(
            event.id,
            before,
            snapshot.player,
            snapshot.titles.filter(title => !presentationBefore.titles.includes(title)),
            !presentationBefore.worldUnlocked && snapshot.worldUnlocked,
            bossDamage,
          ) : undefined;
          if (awarded && receipt) await enqueuePendingRewardPresentation(txn, receipt);
          return { awarded, ...snapshot, ...(receipt ? { receipt } : {}) };
        },
      }));
    });
    return result!;
  }),
}, localQuestVerification, () => new Date(Date.now()).toISOString());

export async function completeVerifiedQuest(input: CompleteQuestInput): Promise<CompleteQuestResult> {
  const result = await completeQuestUseCase({ evidence: input, operationKey: input.operationKey });
  if ('value' in result) return result.value;
  throw new Error(result.reason);
}

export function loadPendingRewardPresentations(): Promise<RewardReceipt[]> {
  return profileTransaction(async txn => {
    const row = await txn.getFirstAsync<{ value: string }>(
      'SELECT value FROM app_state WHERE key=?', PENDING_REWARD_PRESENTATIONS_KEY
    );
    const queue = parsePendingRewardPresentations(row?.value);
    if (!row) return queue;
    if (queue.length === 0) {
      await txn.runAsync('DELETE FROM app_state WHERE key=?', PENDING_REWARD_PRESENTATIONS_KEY);
      return queue;
    }
    const canonical = JSON.stringify(queue);
    if (canonical !== row.value) {
      await txn.runAsync('UPDATE app_state SET value=? WHERE key=?', canonical, PENDING_REWARD_PRESENTATIONS_KEY);
    }
    return queue;
  });
}

export function acknowledgeRewardPresentation(receiptId: string): Promise<void> {
  return profileTransaction(async txn => {
    const row = await txn.getFirstAsync<{ value: string }>(
      'SELECT value FROM app_state WHERE key=?', PENDING_REWARD_PRESENTATIONS_KEY
    );
    if (!row) return;
    const queue = parsePendingRewardPresentations(row.value).filter(receipt => receipt.id !== receiptId);
    if (queue.length) {
      await txn.runAsync('UPDATE app_state SET value=? WHERE key=?', JSON.stringify(queue), PENDING_REWARD_PRESENTATIONS_KEY);
    } else {
      await txn.runAsync('DELETE FROM app_state WHERE key=?', PENDING_REWARD_PRESENTATIONS_KEY);
    }
  });
}

export function loadSystemState(): Promise<SystemSnapshot> {
  return serialized(async () => {
    await initSystemDatabase();
    const db = await getDatabase();
    let snapshot: SystemSnapshot | undefined;
    await db.withExclusiveTransactionAsync(async txn => {
      // Additive initialization only. Existing profiles/completions are never reset.
      await txn.runAsync(
        'INSERT INTO app_state (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING',
        'player', JSON.stringify(createNewPlayer('GRACZ'))
      );
      await txn.runAsync('INSERT INTO app_state(key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING', 'onboarding_complete', 'false');
      await txn.runAsync('INSERT INTO app_state(key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING', 'settings', JSON.stringify(DEFAULT_SETTINGS));
      snapshot = await snapshotInTransaction(txn);
    });
    if (!snapshot) throw new Error('Nie udało się odczytać zapisu SYSTEMU.');
    return snapshot;
  });
}

export function acknowledgeAwakening() {
  return profileTransaction(async txn => {
    const snapshot = await snapshotInTransaction(txn);
    if (!snapshot.awakeningCompleted) throw new Error('Przebudzenie nie zostało ukończone.');
    await txn.runAsync(
      'INSERT INTO app_state (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING',
      'awakening_presentation_seen', 'true'
    );
    return snapshotInTransaction(txn);
  });
}

// Identity/settings writes use the same queue and write lock as quest rewards.
export function profileTransaction<T>(task: (txn: SQLite.SQLiteDatabase) => Promise<T>): Promise<T> {
  return serialized(async () => {
    await initSystemDatabase();
    let result: T;
    await (await getDatabase()).withExclusiveTransactionAsync(async txn => {
      await txn.runAsync('UPDATE app_state SET value = value WHERE key = ?', 'player');
      result = await task(txn);
    });
    return result!;
  });
}
export function finishOnboarding(name: string, birthDate?: string) {
  const birth = birthDate === undefined ? undefined : validateBirthDate(birthDate);
  const displayName = systemName(name);
  return profileTransaction(async txn => {
    const marker = await txn.getFirstAsync<{ value: string }>('SELECT value FROM app_state WHERE key = ?', 'onboarding_complete');
    if (marker?.value === 'true') return snapshotInTransaction(txn);
    const player = await readPlayer(txn);
    await txn.runAsync('UPDATE app_state SET value = ? WHERE key = ?', JSON.stringify({ ...player, displayName, ...(birth ? { birthDate: birth } : {}) }), 'player');
    await txn.runAsync("INSERT INTO app_state(key, value) VALUES ('onboarding_complete', 'true') ON CONFLICT(key) DO UPDATE SET value = excluded.value");
    return snapshotInTransaction(txn);
  });
}
export function updateIdentity(patch: { displayName?: string; birthDate?: string; avatarUri?: string | null; currentTitle?: Title }) {
  const update = { ...patch };
  return profileTransaction(async txn => {
    const snapshot = await snapshotInTransaction(txn);
    if (update.currentTitle && !snapshot.titles.includes(update.currentTitle)) throw new Error('Title nie został jeszcze zdobyty.');
    if (update.avatarUri && !update.avatarUri.startsWith('file://')) throw new Error('Avatar musi być lokalnym plikiem.');
    const player = { ...snapshot.player,
      ...(update.birthDate !== undefined ? { birthDate: validateBirthDate(update.birthDate) } : {}),
      ...(update.displayName !== undefined ? { displayName: systemName(update.displayName) } : {}),
      ...(update.avatarUri !== undefined ? { avatarUri: update.avatarUri ?? undefined } : {}),
      ...(update.currentTitle ? { currentTitle: update.currentTitle } : {}) };
    await txn.runAsync('UPDATE app_state SET value = ? WHERE key = ?', JSON.stringify(player), 'player');
    return snapshotInTransaction(txn);
  });
}
export function saveSettings(patch: SettingsPatch) {
  return profileTransaction(async txn => {
    const row = await txn.getFirstAsync<{ value: string }>('SELECT value FROM app_state WHERE key = ?', 'settings');
    const current = parseSettings(row?.value);
    const safe = mergeSettings(current, patch);
    await txn.runAsync('INSERT INTO app_state(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', 'settings', JSON.stringify(safe));
    return snapshotInTransaction(txn);
  });
}
export function loadSystemLog(): Promise<VerifiedEvent[]> {
  return serialized(async () => {
    await initSystemDatabase();
    const rows = await (await getDatabase()).getAllAsync<{ payload: string }>('SELECT payload FROM verified_events ORDER BY created_at DESC, id DESC LIMIT 50');
    return rows.map(row => parseEvent(row.payload));
  });
}
export function resetSystemData(confirmed: true) {
  if (confirmed !== true) return Promise.reject(new Error('Reset wymaga potwierdzenia.'));
  return profileTransaction(async txn => {
    await ensureAchievementSchema(txn);
    if (await txn.getFirstAsync("SELECT name FROM sqlite_master WHERE type='table' AND name='legacy_player_goals_v8'"))
      await txn.runAsync('DELETE FROM legacy_player_goals_v8');
    for (const table of ['progression_claims', 'progression_contributions', 'journey_milestones', 'journey_activity', 'journey_quests', 'journeys', 'legacy_goal_imports', 'goal_operations', 'player_goals', 'daily_generation', 'daily_rerolls', 'boss_contributions', 'cloud_outbox', 'achievement_events', 'player_titles', 'achievements', 'quest_attempts', 'story_events', 'story_progress', 'boss_progress', 'daily_instances', 'daily_sets', 'protocol_bonuses', 'verified_events', 'quest_completions', 'chapter_completions', 'discovered_sectors', 'world_signals', 'app_state']) await txn.runAsync(`DELETE FROM ${table}`);
    await txn.runAsync('INSERT INTO app_state(key, value) VALUES (?, ?)', 'player', JSON.stringify(createNewPlayer()));
    await txn.runAsync('INSERT INTO app_state(key, value) VALUES (?, ?)', 'onboarding_complete', 'false');
    // A durable cleanup marker lets a failed file deletion resume on next startup.
    await txn.runAsync('INSERT INTO app_state(key, value) VALUES (?, ?)', 'avatar_cleanup_pending', 'true');
    return snapshotInTransaction(txn);
  });
}
export function hasAvatarCleanupPending() {
  return serialized(async () => {
    await initSystemDatabase();
    return Boolean(await (await getDatabase()).getFirstAsync('SELECT value FROM app_state WHERE key = ?', 'avatar_cleanup_pending'));
  });
}
export function acknowledgeAvatarCleanup() {
  return profileTransaction(txn => txn.runAsync('DELETE FROM app_state WHERE key = ?', 'avatar_cleanup_pending'));
}

export function systemDiagnostics() {
 return profileTransaction(async txn => ({
   schema: (await txn.getFirstAsync<{ user_version: number }>('PRAGMA user_version'))?.user_version,
   integrity: (await txn.getFirstAsync<{ quick_check: string }>('PRAGMA quick_check'))?.quick_check,
   events: (await txn.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM verified_events'))?.n,
 }));
}


// Non-verified attempts carry zero rewards and never create a completion record.
export function recordActivityAttempt(questId: string, evidence: ActivityEvidence) {
 const quest = getQuest(questId);
 if (!quest?.activityType) return Promise.reject(new Error('Brak profilu aktywności.'));
 const activity = classifyActivity(quest.activityType, evidence.features, evidence.sensors);
 if (activity.verdict === 'VERIFIED') return Promise.reject(new Error('Użyj transakcji ukończenia.'));
 return profileTransaction(async txn => {
   const snapshot = await snapshotInTransaction(txn);
   await ensureDailyAccess(txn, snapshot.player, questId, snapshot.awakeningCompleted, snapshot.settings.activities ?? DEFAULT_ACTIVITIES);
   const id = 'attempt_' + questId, now = new Date().toISOString();
   const event: VerifiedEvent = { id, playerId: snapshot.player.id, questId, createdAt: now, verificationType: 'GPS_DISTANCE',
     verificationScore: activity.verificationScore, verified: false, realXpAwarded: 0, skillXpAwarded: {}, gameEnergyAwarded: 0, activity };
   await txn.runAsync('INSERT INTO verified_events(id,quest_id,payload,created_at) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload, created_at=excluded.created_at', id, questId, JSON.stringify(event), now);
 });
}

export function beginQuestAttempt(questId:string, attemptId:string) {
 return profileTransaction(async txn=>{
   const snapshot=await snapshotInTransaction(txn), quest=getQuest(questId);
   if(!quest||snapshot.completedQuestIds.includes(questId)||!prerequisitesCompleted(quest,snapshot.completedQuestIds)) throw new Error('Misja nie jest dostępna.');
   if(quest.category==='DAILY') await ensureDailyAccess(txn,snapshot.player,questId,snapshot.awakeningCompleted,snapshot.settings.activities??DEFAULT_ACTIVITIES);
   if(quest.category==='BOSS'&&!await bossAccess(txn,questId)) throw new Error('Etap Bossa jest zablokowany.');
   const pending=await txn.getFirstAsync('SELECT attempt_id FROM quest_attempts WHERE result IS NULL LIMIT 1');
   if(pending) throw new Error('Poprzednia próba jest nadal aktywna. Sprawdź jej zapis przed ponowieniem.');
   await txn.runAsync('INSERT INTO quest_attempts(attempt_id,quest_id,kind,started_at) VALUES (?,?,?,?)',attemptId,questId,attemptKind(quest),new Date(Date.now()).toISOString());
   return attemptId;
 });
}
export function endQuestAttempt(attemptId:string,result:Exclude<AttemptResult,'COMPLETED'>,reason:AttemptReason,duration=0,distance=0) {
 return profileTransaction(async txn=>{
   if(!Number.isFinite(duration)||duration<0||!Number.isFinite(distance)||distance<0) throw new Error('Nieprawidłowe dane próby.');
   const eligible=duration>0 && ((result==='INTERRUPTED'&&['BACKGROUND','LEFT_SCREEN'].includes(reason)) || (['FAILED','REJECTED'].includes(result)&&reason==='VERIFICATION_REJECTED'));
   const changed=await txn.runAsync('UPDATE quest_attempts SET ended_at=?,result=?,reason=?,duration=?,distance=?,eligible=? WHERE attempt_id=? AND result IS NULL',new Date(Date.now()).toISOString(),result,reason,duration,distance,eligible?1:0,attemptId);
   if(changed.changes&&eligible) await storyEvent(txn,'rematch_available:'+attemptId,'REMATCH_AVAILABLE','REMATCH AVAILABLE');
 });
}
const BACKGROUND_QUEST_SESSION_KEY = 'background_quest_session';

function validStoredPoint(value: unknown): value is StoredLocationPoint {
  if (!value || typeof value !== 'object') return false;
  const point = value as Partial<StoredLocationPoint>;
  return typeof point.latitude === 'number' && Number.isFinite(point.latitude) && Math.abs(point.latitude) <= 90 &&
    typeof point.longitude === 'number' && Number.isFinite(point.longitude) && Math.abs(point.longitude) <= 180 &&
    typeof point.accuracy === 'number' && Number.isFinite(point.accuracy) && point.accuracy >= 0 && point.accuracy <= 100 &&
    typeof point.timestamp === 'number' && Number.isFinite(point.timestamp) &&
    typeof point.mocked === 'boolean';
}

function parseBackgroundQuestSession(raw?: string): BackgroundQuestSession | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<BackgroundQuestSession>;
    if (typeof value.questId !== 'string' || typeof value.attemptId !== 'string' ||
        !['FOREGROUND','BACKGROUND'].includes(value.mode ?? '') ||
        typeof value.extendedGoal !== 'boolean' || typeof value.updatedAt !== 'string' ||
        (value.lastPoint !== undefined && !validStoredPoint(value.lastPoint)) ||
        (value.lastObservedTimestamp !== undefined &&
          (typeof value.lastObservedTimestamp !== 'number' || !Number.isFinite(value.lastObservedTimestamp)))) return null;
    return value as BackgroundQuestSession;
  } catch {
    return null;
  }
}

export function loadBackgroundQuestSession(): Promise<BackgroundQuestSession | null> {
  return profileTransaction(async txn => {
    const row = await txn.getFirstAsync<{ value: string }>(
      'SELECT value FROM app_state WHERE key=?', BACKGROUND_QUEST_SESSION_KEY
    );
    const session = parseBackgroundQuestSession(row?.value);
    if (!session && row) await txn.runAsync('DELETE FROM app_state WHERE key=?', BACKGROUND_QUEST_SESSION_KEY);
    return session;
  });
}

export function saveBackgroundQuestSession(session: BackgroundQuestSession) {
  if (!session.questId || !session.attemptId || !['FOREGROUND','BACKGROUND'].includes(session.mode) ||
      (session.lastPoint && !validStoredPoint(session.lastPoint))) {
    return Promise.reject(new Error('Nieprawidłowy stan pomiaru w tle.'));
  }
  const safe: BackgroundQuestSession = {
    questId: session.questId,
    attemptId: session.attemptId,
    mode: session.mode,
    extendedGoal: Boolean(session.extendedGoal),
    ...(session.lastPoint ? { lastPoint: { ...session.lastPoint } } : {}),
    ...(session.lastObservedTimestamp !== undefined ? { lastObservedTimestamp: session.lastObservedTimestamp } : {}),
    updatedAt: session.updatedAt,
  };
  return profileTransaction(txn => txn.runAsync(
    'INSERT INTO app_state(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
    BACKGROUND_QUEST_SESSION_KEY, JSON.stringify(safe)
  ));
}

export function updateBackgroundQuestSession(
  questId: string,
  patch: Partial<Omit<BackgroundQuestSession, 'questId' | 'attemptId'>>,
): Promise<BackgroundQuestSession | null> {
  return profileTransaction(async txn => {
    const row = await txn.getFirstAsync<{ value: string }>(
      'SELECT value FROM app_state WHERE key=?', BACKGROUND_QUEST_SESSION_KEY
    );
    const current = parseBackgroundQuestSession(row?.value);
    if (!current || current.questId !== questId) return null;
    const next: BackgroundQuestSession = {
      ...current,
      ...patch,
      questId: current.questId,
      attemptId: current.attemptId,
      updatedAt: new Date().toISOString(),
    };
    if (next.lastPoint && !validStoredPoint(next.lastPoint)) throw new Error('Nieprawidłowy punkt GPS.');
    await txn.runAsync(
      'UPDATE app_state SET value=? WHERE key=?',
      JSON.stringify(next), BACKGROUND_QUEST_SESSION_KEY
    );
    return next;
  });
}

export function clearBackgroundQuestSession(questId?: string) {
  return profileTransaction(async txn => {
    if (questId) {
      const row = await txn.getFirstAsync<{ value: string }>(
        'SELECT value FROM app_state WHERE key=?', BACKGROUND_QUEST_SESSION_KEY
      );
      const current = parseBackgroundQuestSession(row?.value);
      if (current && current.questId !== questId) return;
    }
    await txn.runAsync('DELETE FROM app_state WHERE key=?', BACKGROUND_QUEST_SESSION_KEY);
  });
}

function questCheckpointKey(questId: string) { return 'quest_checkpoint:' + questId; }

function isFiniteNonNegative(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function parseQuestCheckpoint(raw: string | undefined, questId: string): QuestCheckpoint | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<QuestCheckpoint>;
    if (value.questId !== questId || !isFiniteNonNegative(value.distanceMeters) ||
        !isFiniteNonNegative(value.durationSeconds) || !isFiniteNonNegative(value.verificationScore) ||
        (value.verificationScore ?? 101) > 100 || typeof value.extendedGoal !== 'boolean' ||
        typeof value.updatedAt !== 'string') return null;
    return {
      questId,
      distanceMeters: value.distanceMeters!,
      durationSeconds: value.durationSeconds!,
      verificationScore: value.verificationScore!,
      extendedGoal: value.extendedGoal!,
      ...(value.activityFeatures ? { activityFeatures: value.activityFeatures } : {}),
      updatedAt: value.updatedAt!,
    };
  } catch {
    return null;
  }
}

export function loadQuestCheckpoint(questId: string): Promise<QuestCheckpoint | null> {
  return profileTransaction(async txn => {
    const row = await txn.getFirstAsync<{ value: string }>('SELECT value FROM app_state WHERE key=?', questCheckpointKey(questId));
    const checkpoint = parseQuestCheckpoint(row?.value, questId);
    if (!checkpoint && row) await txn.runAsync('DELETE FROM app_state WHERE key=?', questCheckpointKey(questId));
    return checkpoint;
  });
}

export function saveQuestCheckpoint(checkpoint: QuestCheckpoint) {
  const quest = getQuest(checkpoint.questId);
  if (!quest || quest.verification.type === 'TIMER') return clearQuestCheckpoint(checkpoint.questId);
  if (!isFiniteNonNegative(checkpoint.distanceMeters) || checkpoint.distanceMeters <= 0 ||
      !isFiniteNonNegative(checkpoint.durationSeconds) || !isFiniteNonNegative(checkpoint.verificationScore) ||
      checkpoint.verificationScore > 100) return Promise.reject(new Error('Nieprawidłowy zapis postępu misji.'));
  const safe: QuestCheckpoint = {
    questId: checkpoint.questId,
    distanceMeters: checkpoint.distanceMeters,
    durationSeconds: checkpoint.durationSeconds,
    verificationScore: checkpoint.verificationScore,
    extendedGoal: Boolean(checkpoint.extendedGoal),
    ...(checkpoint.activityFeatures ? { activityFeatures: { ...checkpoint.activityFeatures } } : {}),
    updatedAt: checkpoint.updatedAt,
  };
  return profileTransaction(txn => txn.runAsync(
    'INSERT INTO app_state(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
    questCheckpointKey(checkpoint.questId), JSON.stringify(safe)
  ));
}

export function clearQuestCheckpoint(questId: string) {
  return profileTransaction(txn => txn.runAsync('DELETE FROM app_state WHERE key=?', questCheckpointKey(questId)));
}

export function listQuestAttempts() { return profileTransaction(txn=>txn.getAllAsync<QuestAttempt>('SELECT * FROM quest_attempts ORDER BY started_at DESC,attempt_id DESC LIMIT 50')); }
export function loadChronicle() { return profileTransaction(txn=>txn.getAllAsync<StoryEvent>("SELECT * FROM story_events WHERE type NOT IN ('REMATCH_AVAILABLE','REMATCH_COMPLETED') ORDER BY created_at DESC,id DESC LIMIT 50")); }
export function consumeStoryEvent(id:string) { return profileTransaction(txn=>txn.runAsync('UPDATE story_events SET consumed=1 WHERE id=?',id)); }
export function startBossProtocol() {
 return profileTransaction(async txn=>{
   const snapshot=await snapshotInTransaction(txn);
   if(!snapshot.story.worldLinkComplete||snapshot.daily?.clockAnomaly) throw new Error('BOSS PROTOCOL jest zablokowany. Sprawdź WORLD LINK i datę telefonu.');
   await txn.runAsync('INSERT INTO boss_progress(id,started_at,start_day) VALUES (?,?,?) ON CONFLICT(id) DO NOTHING',BOSS_ID,new Date(Date.now()).toISOString(),dayKey());
   await storyEvent(txn,'boss_started','BOSS_STARTED','THE FIRST WALL // BOSS STARTED');
   return snapshotInTransaction(txn);
 });
}

// Manual local diagnostics: no telemetry and no repair of corrupt player values.
export function testerHealthCheck(): Promise<LocalHealth> {
  return serialized(async () => {
    try {
      await initSystemDatabase();
      let result: LocalHealth | undefined;
      await (await getDatabase()).withExclusiveTransactionAsync(async txn => { result = await inspectLocalHealth(txn); });
      return result!;
    } catch { return { ok: false, schema: null, issues: [{ code: 'STORAGE_UNAVAILABLE' }] }; }
  });
}

const CLOUD_USER_BINDING_KEY = 'cloud_user_binding_v1';

export function getCloudUserBinding(): Promise<string | null> {
  return profileTransaction(async txn => {
    const row = await txn.getFirstAsync<{ value: string }>(
      'SELECT value FROM app_state WHERE key=?',
      CLOUD_USER_BINDING_KEY,
    );
    return row?.value ?? null;
  });
}

export function ensureCloudUserBinding(userId: string): Promise<void> {
  const normalized = userId.trim();
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(normalized)) {
    return Promise.reject(new Error('Nieprawidłowy identyfikator konta SYSTEM CLOUD.'));
  }
  return profileTransaction(async txn => {
    const row = await txn.getFirstAsync<{ value: string }>(
      'SELECT value FROM app_state WHERE key=?',
      CLOUD_USER_BINDING_KEY,
    );
    if (!row) {
      await txn.runAsync(
        'INSERT INTO app_state(key,value) VALUES(?,?)',
        CLOUD_USER_BINDING_KEY,
        normalized,
      );
      return;
    }
    if (row.value !== normalized) {
      throw new Error(
        'Ten lokalny profil jest już połączony z innym kontem SYSTEM CLOUD. Aby użyć innego konta, najpierw wyczyść lokalne dane SYSTEMU.',
      );
    }
  });
}

export type CloudOutboxRow = {
  event_key: string;
  entity_type: string;
  entity_id: string | null;
  payload: string;
  client_created_at: string;
  schema_version: number;
  attempts: number;
  last_attempt_at: string | null;
  last_error: string | null;
  synced_at: string | null;
};

function cloudEvidencePayload(event: VerifiedEvent) {
  return {
    quest_id: event.questId,
    completed_day: dayKey(Date.parse(event.createdAt)),
    verification_type: event.verificationType,
    verification_score: event.verificationScore,
    ...(event.distanceMeters !== undefined ? { distance_meters: event.distanceMeters } : {}),
    ...(event.durationSeconds !== undefined ? { duration_seconds: event.durationSeconds } : {}),
    ...(event.steps !== undefined ? { steps: event.steps } : {}),
    ...(event.activity ? {
      activity: {
        expected: event.activity.activityTypeExpected,
        detected: event.activity.activityTypeDetected,
        verdict: event.activity.verdict,
        score: event.activity.verificationScore,
        reason_codes: event.activity.reasonCodes,
        features: event.activity.features,
        sensors: event.activity.sensors,
        sensor_sources: event.activity.sensorSources,
      },
    } : {}),
  };
}

async function enqueueCloudOutboxEvent(txn: SQLite.SQLiteDatabase, event: VerifiedEvent) {
  if (!event.verified) return;
  await txn.runAsync(
    `INSERT INTO cloud_outbox(event_key,entity_type,entity_id,payload,client_created_at,schema_version)
     VALUES(?,?,?,?,?,1) ON CONFLICT(event_key) DO NOTHING`,
    'verified:' + event.id,
    'VERIFIED_EVENT',
    event.questId,
    JSON.stringify(cloudEvidencePayload(event)),
    event.createdAt,
  );
}

export function backfillCloudOutbox() {
  return profileTransaction(async txn => {
    // Chapter, daily/weekly and world transactions also produce verified events.
    // Reconcile missing entries on every sync, including after the legacy marker.
    const rows = await txn.getAllAsync<{ payload: string }>(
      `SELECT v.payload FROM verified_events v
       WHERE NOT EXISTS (SELECT 1 FROM cloud_outbox o WHERE o.event_key = 'verified:' || v.id)
         AND CASE WHEN json_valid(v.payload) THEN
           json_extract(v.payload, '$.verified') = 1
           AND json_extract(v.payload, '$.id') = v.id
           AND json_extract(v.payload, '$.questId') = v.quest_id
         ELSE 0 END
       ORDER BY v.created_at ASC, v.id ASC LIMIT 500`
    );
    for (const row of rows) {
      const event = JSON.parse(row.payload) as VerifiedEvent;
      if (event?.verified === true && typeof event.id === 'string' && typeof event.questId === 'string') {
        await enqueueCloudOutboxEvent(txn, event);
      }
    }
    // Story awards use a separate local journal. Send only a completion claim;
    // the server must derive eligibility and reward from its own evidence.
    const story = await txn.getAllAsync<{ id: string; completed_at: string }>(
      `SELECT s.id,s.completed_at FROM story_progress s
       WHERE NOT EXISTS (SELECT 1 FROM cloud_outbox o WHERE o.event_key = 'verified:story:' || s.id)
       ORDER BY s.completed_at,s.id LIMIT 100`
    );
    for (const row of story) {
      await txn.runAsync(
        `INSERT INTO cloud_outbox(event_key,entity_type,entity_id,payload,client_created_at,schema_version)
         VALUES(?,?,?,?,?,1) ON CONFLICT(event_key) DO NOTHING`,
        'verified:story:' + row.id, 'VERIFIED_EVENT', row.id,
        JSON.stringify({ quest_id: row.id, verification_type: 'MULTI', verification_score: 100 }),
        row.completed_at,
      );
    }
  });
}

export function listPendingCloudOutbox(limit = 25) {
  const safeLimit = Math.max(1, Math.min(Math.floor(limit), 100));
  return profileTransaction(txn => txn.getAllAsync<CloudOutboxRow>(
    `SELECT * FROM cloud_outbox
     WHERE synced_at IS NULL
       AND (
         attempts = 0 OR last_attempt_at IS NULL OR
         (attempts = 1 AND (julianday('now') - julianday(last_attempt_at)) * 86400 >= 60) OR
         (attempts = 2 AND (julianday('now') - julianday(last_attempt_at)) * 86400 >= 300) OR
         (attempts = 3 AND (julianday('now') - julianday(last_attempt_at)) * 86400 >= 900) OR
         (attempts = 4 AND (julianday('now') - julianday(last_attempt_at)) * 86400 >= 3600) OR
         (attempts >= 5 AND (julianday('now') - julianday(last_attempt_at)) * 86400 >= 21600)
       )
     ORDER BY client_created_at ASC,event_key ASC LIMIT ?`,
    safeLimit,
  ));
}

export function markCloudOutboxSynced(eventKey: string) {
  return profileTransaction(txn => txn.runAsync(
    'UPDATE cloud_outbox SET synced_at=?,last_error=NULL,last_attempt_at=? WHERE event_key=?',
    new Date().toISOString(), new Date().toISOString(), eventKey,
  ));
}

export function markCloudOutboxAttempt(eventKey: string, error: string) {
  return profileTransaction(txn => txn.runAsync(
    'UPDATE cloud_outbox SET attempts=attempts+1,last_attempt_at=?,last_error=? WHERE event_key=? AND synced_at IS NULL',
    new Date().toISOString(), error.slice(0, 300), eventKey,
  ));
}

export function cloudOutboxStats() {
  return profileTransaction(async txn => {
    const row = await txn.getFirstAsync<{ pending: number; synced: number; failed: number }>(
      `SELECT
        SUM(CASE WHEN synced_at IS NULL THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN synced_at IS NOT NULL THEN 1 ELSE 0 END) AS synced,
        SUM(CASE WHEN synced_at IS NULL AND attempts > 0 THEN 1 ELSE 0 END) AS failed
       FROM cloud_outbox`
    );
    return { pending: row?.pending ?? 0, synced: row?.synced ?? 0, failed: row?.failed ?? 0 };
  });
}

export function createPlayerGoal(input: GoalInput, operationKey?: string) {
 return profileTransaction(async txn => { await insertGoal(txn,input,Date.now(),operationKey); return snapshotInTransaction(txn); });
}
export function updateGoalStatus(id: string, status: GoalStatus) {
 return profileTransaction(async txn => { await changeGoalStatus(txn,id,status); return snapshotInTransaction(txn); });
}

export function applyAIDailyPlan(plan: AIGameMasterResponse) {
 return profileTransaction(async txn => {
   const snapshot = await snapshotInTransaction(txn);
   const daily = snapshot.daily;
   if (!daily || daily.clockAnomaly || daily.clear || plan.source !== 'ai') return snapshot;

   const markerKey = 'ai_daily_applied:' + daily.dayKey;
   const presentationKey = 'ai_daily_presentation:' + daily.dayKey;
   if (await txn.getFirstAsync('SELECT value FROM app_state WHERE key=?', markerKey)) return snapshot;

   const touched = await txn.getFirstAsync(
     `SELECT d.id FROM daily_instances d
      WHERE d.day_key=? AND (
        EXISTS(SELECT 1 FROM quest_completions c WHERE c.quest_id=d.id)
        OR EXISTS(SELECT 1 FROM quest_attempts a WHERE a.quest_id=d.id)
      ) LIMIT 1`,
     daily.dayKey,
   );
   if (touched) return snapshot;

   const input = await generationInput(
     txn,
     snapshot.player,
     daily.dayKey,
     snapshot.settings.activities ?? DEFAULT_ACTIVITIES,
   );
   input.exclude = [];
   const candidates = candidatesFromAI(input, plan, 3);
   if (candidates.length !== 3) return snapshot;

   const old = await txn.getAllAsync<{id:string}>(
     'SELECT id FROM daily_instances WHERE day_key=?',
     daily.dayKey,
   );
   for (const row of old) {
     await txn.runAsync('DELETE FROM journey_quests WHERE quest_id=?', row.id);
     await txn.runAsync('DELETE FROM journey_activity WHERE quest_id=?', row.id);
   }
   await txn.runAsync('DELETE FROM daily_rerolls WHERE day_key=?', daily.dayKey);
   await txn.runAsync('DELETE FROM daily_generation WHERE day_key=?', daily.dayKey);
   await txn.runAsync('DELETE FROM daily_instances WHERE day_key=?', daily.dayKey);

   for (const candidate of candidates) await persistCandidate(txn, candidate);

   await txn.runAsync(
     'INSERT INTO app_state(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
     presentationKey,
     JSON.stringify({
       quests: candidates.map(candidate => ({
         id: candidate.quest.id,
         title: candidate.quest.title,
         description: candidate.quest.description,
       })),
     }),
   );
   await hydrateAIQuestPresentations(txn);

   await txn.runAsync(
     'INSERT INTO app_state(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
     markerKey,
     JSON.stringify({
       source: plan.source,
       model: plan.model ?? null,
       briefing: plan.briefing,
       director: plan.director,
       research: plan.research ?? null,
       memory: plan.memory ?? null,
       generatedAt: new Date().toISOString(),
     }),
   );
   await storyEvent(
     txn,
     'ai_daily_applied:' + daily.dayKey,
     'DAILY_GENERATED',
     'AI GAME MASTER // LOADOUT',
     plan.briefing.slice(0, 240),
   );
   return snapshotInTransaction(txn);
 });
}

export function rerollDailyQuest(id:string) { return profileTransaction(async txn=>{
 const snapshot=await snapshotInTransaction(txn),daily=snapshot.daily;
 if(!daily||daily.clockAnomaly||daily.rerollsUsed||!daily.questIds.includes(id)||snapshot.completedQuestIds.includes(id)) throw new Error('Wymiana niedostępna: jeden niewykonany Daily dziennie.');
 if(await txn.getFirstAsync('SELECT attempt_id FROM quest_attempts WHERE quest_id=? LIMIT 1',id))throw new Error('Rozpoczętej misji nie można wymienić.');
 const input=await generationInput(txn,snapshot.player,daily.dayKey,snapshot.settings.activities??DEFAULT_ACTIVITIES);
 input.exclude=daily.questIds.map(id=>templateFor(id)?.id??'');
 const old=getQuest(id)!;
 input.maximumDifficulty=old.difficulty==='EXTREME'?'HARD':old.difficulty;
 const choices=generateLoadout(input,3);
 const next=choices.find(c=>c.quest.difficulty===old.difficulty)??choices.find(c=>c.quest.difficulty==='EASY')??choices[0];
 if(!next||next.quest.id===id)throw new Error('Brak odpowiedniego zamiennika. Spróbuj jutro.');
 await txn.runAsync('INSERT INTO daily_rerolls(day_key,old_id,new_id) VALUES (?,?,?)',daily.dayKey,id,next.quest.id);
 await txn.runAsync('DELETE FROM daily_instances WHERE id=?',id);
 await persistCandidate(txn,next);
 await storyEvent(txn,'reroll:'+daily.dayKey,'QUEST_REROLLED','DAILY REPLACED',old.title+' → '+next.quest.title);
 return snapshotInTransaction(txn);
}); }

const MOVE_STATE_KEY='system_move_state_v1';
function validMoveState(value:unknown):value is MoveState{
 if(!value||typeof value!=='object')return false;
 const row=value as Partial<MoveState>;
 const modes=['UNDER_6','AGE_6_8','AGE_9_12','AGE_13_17','ADULT','UNKNOWN'];
 const safeInt=(n:unknown)=>typeof n==='number'&&Number.isSafeInteger(n)&&n>=0;
 const skills=row.skills as Record<string,{key?:unknown;level?:unknown;xp?:unknown;xpToNext?:unknown}>|undefined;
 return typeof row.dayKey==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(row.dayKey)&&typeof row.ageMode==='string'&&modes.includes(row.ageMode)
  &&Array.isArray(row.completedQuestIds)&&row.completedQuestIds.every(x=>typeof x==='string'&&x.length>0)
  &&safeInt(row.activeMinutes)&&safeInt(row.streak)&&safeInt(row.bestStreak)&&Number(row.bestStreak)>=Number(row.streak)
  &&(row.lastActiveDay===null||typeof row.lastActiveDay==='string')
  &&!!skills&&!Array.isArray(skills)&&MOVEMENT_SKILLS.every(key=>{
    const item=skills[key];return !!item&&item.key===key&&safeInt(item.xp)&&safeInt(item.xpToNext)&&typeof item.level==='number'&&Number.isSafeInteger(item.level)&&item.level>=1;
  })
  &&Array.isArray(row.history)&&row.history.every(day=>!!day&&typeof day==='object'
    &&typeof day.dayKey==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(day.dayKey)
    &&safeInt(day.minutes)&&Array.isArray(day.questIds)&&day.questIds.every(id=>typeof id==='string'));
}
export function loadMoveState(now=Date.now()):Promise<MoveState>{
 return serialized(async()=>{
  await initSystemDatabase();
  const db=await getDatabase();
  const player=await readPlayer(db);
  const currentDay=dayKey(now),age=moveAgeMode(player.birthDate,new Date(now));
  const row=await db.getFirstAsync<{value:string}>('SELECT value FROM app_state WHERE key=?',MOVE_STATE_KEY);
  let state:MoveState;
  try{const parsed=row?JSON.parse(row.value):null;state=validMoveState(parsed)?parsed:createMoveState(currentDay,age)}catch{state=createMoveState(currentDay,age)}
  const next=rolloverMoveState(state,currentDay,age);
  if(!row||JSON.stringify(next)!==row.value)await db.runAsync('INSERT INTO app_state(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',MOVE_STATE_KEY,JSON.stringify(next));
  return next;
 });
}
export function completeMoveActivity(evidence:MoveCompletionEvidence):Promise<MoveState>{
 return serialized(async()=>{
  await initSystemDatabase();
  const db=await getDatabase();
  let result!:MoveState;
  await db.withExclusiveTransactionAsync(async txn=>{
    const player=await readPlayer(txn);
    const age=moveAgeMode(player.birthDate,new Date(Date.now()));
    const row=await txn.getFirstAsync<{value:string}>('SELECT value FROM app_state WHERE key=?',MOVE_STATE_KEY);
    let state:MoveState;
    try{const parsed=row?JSON.parse(row.value):null;state=validMoveState(parsed)?parsed:createMoveState(evidence.dayKey,age)}catch{state=createMoveState(evidence.dayKey,age)}
    result=reduceMoveQuest(rolloverMoveState(state,evidence.dayKey,age),evidence);
    await txn.runAsync('INSERT INTO app_state(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',MOVE_STATE_KEY,JSON.stringify(result));
  });
  return result;
 });
}
