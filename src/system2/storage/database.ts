import { createQuestCompletion } from '../application/completeQuest';
import { localQuestVerification } from '../verification/localProvider';
import { questAvailability } from '../quests/availability';
import { completionRepositories } from './completionRepositories';
import { reconcileStory, completeStoryActivity, bossAccess, storyEvent } from './story';
import { BOSS_ID, attemptKind } from '../story/catalog';
import type { StoryState, StoryEvent, QuestAttempt, AttemptResult, AttemptReason } from '../story/types';
import { dayKey } from '../daily/calendar';
import { classifyActivity } from '../activity/classifier';
import type { ActivityEvidence } from '../activity/types';
import { dailyState, ensureDailyAccess, awardProtocols, currentStreak, type DailyState } from './daily';
import { DEFAULT_ACTIVITIES } from '../daily/templates';
import { getQuest } from '../quests/catalog';
import * as SQLite from 'expo-sqlite';
import { migrateDatabase } from './migrations';
import { normalizePlayer } from '../core/progression';
import { earnedTitles, systemName, parseSettings, type Settings, type Title } from '../identity/model';
import { rewardReceipt, type RewardReceipt } from '../core/rewards';
import { parseEvent } from '../identity/history';

import {
  createNewPlayer,
  type PlayerProfile, type VerifiedEvent,
} from '../core';
import { getQuestStatus, prerequisitesCompleted } from '../quests/catalog';
import type { QuestEvidence } from '../quests/types';
import { awardAwakeningIfEligible } from './chapter';

export type CompleteQuestInput = QuestEvidence & { operationKey?: string };
export type SystemSnapshot = {
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

async function completedQuestIds(db: SQLite.SQLiteDatabase): Promise<string[]> {
  const rows = await db.getAllAsync<{ quest_id: string }>('SELECT quest_id FROM quest_completions');
  return rows.map(row => row.quest_id);
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
        await txn.runAsync("UPDATE quest_attempts SET result='ABANDONED',reason='PROCESS_ENDED',ended_at=? WHERE result IS NULL",new Date(Date.now()).toISOString());
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
  const daily = await dailyState(db, chapter.player, chapter.awakeningCompleted, preferences.activities ?? DEFAULT_ACTIVITIES);
  if (daily) chapter.player.streak = await currentStreak(db, daily.dayKey, chapter.player.streak);
  return {
    daily, story: reconciled.story,
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
      result = await work(completionRepositories(txn, () => readPlayer(txn), async id => {
        const quest = getQuest(id);
        const ids = await completedQuestIds(txn);
        const daily = quest?.category === 'DAILY' ? (await snapshotInTransaction(txn)).daily : null;
        return questAvailability(id, { completedQuestIds: ids, daily,
          bossAccessible: quest?.category === 'BOSS' ? await bossAccess(txn, id) : false });
      }, {
        async apply(player, quest, evidence, now) {
          return awardProtocols(txn, await completeStoryActivity(txn, player, quest, evidence), quest.id, now);
        },
        async result(awarded, before, event) {
          const snapshot = await snapshotInTransaction(txn);
          return { awarded, ...snapshot, ...(event ? { receipt: rewardReceipt(event.id, before, snapshot.player,
            snapshot.awakeningAwarded ? ['AWAKENED'] : [], snapshot.awakeningAwarded) } : {}) };
        },
      }));
    });
    return result!;
  }),
}, localQuestVerification, () => new Date().toISOString());

export async function completeVerifiedQuest(input: CompleteQuestInput): Promise<CompleteQuestResult> {
  const result = await completeQuestUseCase({ evidence: input, operationKey: input.operationKey });
  if ('value' in result) return result.value;
  throw new Error(result.reason);
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
      snapshot = await snapshotInTransaction(txn);
    });
    if (!snapshot) throw new Error('Nie udało się odczytać zapisu SYSTEMU.');
    return snapshot;
  });
}

export function acknowledgeAwakening() {
  return serialized(async () => {
    await initSystemDatabase();
    const db = await getDatabase();
    await db.withExclusiveTransactionAsync(async txn => {
      const snapshot = await snapshotInTransaction(txn);
      if (!snapshot.awakeningCompleted) throw new Error('Przebudzenie nie zostało ukończone.');
      await txn.runAsync(
        'INSERT INTO app_state (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING',
        'awakening_presentation_seen', 'true'
      );
    });
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
export function finishOnboarding(name: string) {
  const displayName = systemName(name);
  return profileTransaction(async txn => {
    const marker = await txn.getFirstAsync<{ value: string }>('SELECT value FROM app_state WHERE key = ?', 'onboarding_complete');
    if (marker?.value === 'true') return snapshotInTransaction(txn);
    const player = await readPlayer(txn);
    await txn.runAsync('UPDATE app_state SET value = ? WHERE key = ?', JSON.stringify({ ...player, displayName }), 'player');
    await txn.runAsync("INSERT INTO app_state(key, value) VALUES ('onboarding_complete', 'true') ON CONFLICT(key) DO UPDATE SET value = excluded.value");
    return snapshotInTransaction(txn);
  });
}
export function updateIdentity(patch: { displayName?: string; avatarUri?: string | null; currentTitle?: Title }) {
  const update = { ...patch };
  return profileTransaction(async txn => {
    const snapshot = await snapshotInTransaction(txn);
    if (update.currentTitle && !snapshot.titles.includes(update.currentTitle)) throw new Error('Title nie został jeszcze zdobyty.');
    if (update.avatarUri && !update.avatarUri.startsWith('file://')) throw new Error('Avatar musi być lokalnym plikiem.');
    const player = { ...snapshot.player,
      ...(update.displayName !== undefined ? { displayName: systemName(update.displayName) } : {}),
      ...(update.avatarUri !== undefined ? { avatarUri: update.avatarUri ?? undefined } : {}),
      ...(update.currentTitle ? { currentTitle: update.currentTitle } : {}) };
    await txn.runAsync('UPDATE app_state SET value = ? WHERE key = ?', JSON.stringify(player), 'player');
    return snapshotInTransaction(txn);
  });
}
export function saveSettings(settings: Settings) {
  const safe = parseSettings(JSON.stringify(settings));
  return profileTransaction(async txn => {
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
    for (const table of ['quest_attempts', 'story_events', 'story_progress', 'boss_progress', 'daily_instances', 'daily_sets', 'protocol_bonuses', 'verified_events', 'quest_completions', 'chapter_completions', 'discovered_sectors', 'world_signals', 'app_state']) await txn.runAsync(`DELETE FROM ${table}`);
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
