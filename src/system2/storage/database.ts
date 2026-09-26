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
import { createLoot, equipItem, unequipItem, type InventoryItem, type LootSource } from '../core/inventory';
import { claimSocialReward, historyEntry, socialAchievements, type SocialHistoryEntry, type SocialMode, type SocialSession } from '../core/social';
import { parseEvent } from '../identity/history';

import {
  addRealXp, addSkillXp, createNewPlayer,
  type PlayerProfile, type SkillKey, type VerifiedEvent,
} from '../core';
import { validateQuestEvidence, getQuestStatus, prerequisitesCompleted } from '../quests/catalog';
import type { QuestEvidence } from '../quests/types';
import { awardAwakeningIfEligible } from './chapter';

export type CompleteQuestInput = QuestEvidence;
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
  gameMasterProfile: { goal: string; path: 'DISCIPLINE'|'MOTION'|'FOCUS' } | null;
  recentAttempt: { questId:string; result:string; reason:string|null } | null;
  recentAttempts: { questId:string; result:string; reason:string|null }[];
  guardianApproval: { status:'PENDING'|'APPROVED'|'REJECTED'; updatedAt:string } | null;
};
export type CompleteQuestResult = SystemSnapshot & { awarded: boolean; awakeningAwarded: boolean; receipt?: RewardReceipt; loot?: InventoryItem };

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
      access = getQuestStatus(questId, snapshot.completedQuestIds);
      if (getQuest(questId)?.category === 'BOSS' && access !== 'COMPLETED' && !await bossAccess(txn,questId)) access = 'LOCKED';
      if (getQuest(questId)?.category === 'DAILY' && access !== 'COMPLETED') {
        if (!snapshot.daily || snapshot.daily.clockAnomaly || !snapshot.daily.questIds.includes(questId)) access = 'LOCKED';
      }
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
  const gm = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_state WHERE key = ?', 'game_master_profile');
  const recentAttempt = await db.getFirstAsync<{quest_id:string;result:string;reason:string|null}>("SELECT quest_id,result,reason FROM quest_attempts WHERE result IS NOT NULL ORDER BY started_at DESC,attempt_id DESC LIMIT 1");
  const recentAttempts = await db.getAllAsync<{quest_id:string;result:string;reason:string|null}>("SELECT quest_id,result,reason FROM quest_attempts WHERE result IS NOT NULL ORDER BY started_at DESC,attempt_id DESC LIMIT 5");
  const guardian = await db.getFirstAsync<{value:string}>("SELECT value FROM app_state WHERE key='guardian_approval'");
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
    gameMasterProfile: gm?.value ? JSON.parse(gm.value) : null,
    recentAttempt: recentAttempt ? {questId:recentAttempt.quest_id,result:recentAttempt.result,reason:recentAttempt.reason} : null,
    recentAttempts: recentAttempts.map(x=>({questId:x.quest_id,result:x.result,reason:x.reason})),
    guardianApproval: guardian?.value ? JSON.parse(guardian.value) : null,
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

export function completeVerifiedQuest(input: CompleteQuestInput): Promise<CompleteQuestResult> {
  // Snapshot caller data before entering the queue. Rewards come only from the quest definition.
  const evidence: CompleteQuestInput = JSON.parse(JSON.stringify(input));
  return serialized(async () => {
    const quest = validateQuestEvidence(evidence);
    await initSystemDatabase();
    const db = await getDatabase();
    let result: CompleteQuestResult | undefined;
    await db.withExclusiveTransactionAsync(async txn => {
      const now = new Date().toISOString();
      // First statement takes the write lock BEFORE reading the current profile.
      const claim = await txn.runAsync(
        'INSERT INTO quest_completions (quest_id, completed_at) VALUES (?, ?) ON CONFLICT(quest_id) DO NOTHING',
        quest.id, now
      );
      let player = await readPlayer(txn);
      if (claim.changes === 0) {
        result = { awarded: false, ...await snapshotInTransaction(txn) };
        return;
      }
      if (!prerequisitesCompleted(quest, await completedQuestIds(txn))) {
        throw new Error('Ta misja jest zablokowana. Ukończ poprzednie questy Awakening.');
      }
      if (quest.category === 'BOSS' && !await bossAccess(txn,quest.id)) throw new Error('Ten etap Bossa jest zablokowany.');
      if (quest.category === 'DAILY') {
        const snapshot = await snapshotInTransaction(txn);
        await ensureDailyAccess(txn, player, quest.id, snapshot.awakeningCompleted, snapshot.settings.activities ?? DEFAULT_ACTIVITIES);
        player = await readPlayer(txn);
      }
      let next = addRealXp(player, quest.rewards.realXp);
      for (const [key, xp] of Object.entries(quest.rewards.skillXp ?? {})) {
        next = addSkillXp(next, key as SkillKey, xp);
      }
      next = {
        ...next,
        verifiedQuestCount: next.verifiedQuestCount + 1,
        gameEnergy: next.gameEnergy + (quest.rewards.gameEnergy ?? 0),
        totalDistanceMeters: next.totalDistanceMeters + (evidence.verificationType !== 'TIMER' ? evidence.distanceMeters : 0),
        updatedAt: now,
      };
      const event: VerifiedEvent = {
        activity: quest.activityType ? evidence.activity : undefined,
        id: 'quest_' + quest.id,
        playerId: next.id, questId: quest.id, createdAt: now,
        verificationType: evidence.verificationType,
        verificationScore: evidence.verificationScore, verified: true,
        realXpAwarded: quest.rewards.realXp,
        skillXpAwarded: { ...quest.rewards.skillXp },
        gameEnergyAwarded: quest.rewards.gameEnergy ?? 0,
        distanceMeters: evidence.distanceMeters, durationSeconds: evidence.durationSeconds,
      };
      next = await completeStoryActivity(txn,next,quest,evidence);
      next = await awardProtocols(txn, next, quest.id, now);
      await txn.runAsync('UPDATE app_state SET value = ? WHERE key = ?', JSON.stringify(next), 'player');
      await txn.runAsync(
        'INSERT INTO verified_events (id, quest_id, payload, created_at) VALUES (?, ?, ?, ?)',
        event.id, quest.id, JSON.stringify(event), now
      );
      const lootSource:LootSource=quest.category==='BOSS'?'BOSS':quest.category==='WEEKLY'?'WEEKLY':quest.category==='WORLD'?'WORLD':quest.category==='DAILY'?'DAILY':'QUEST';
      const loot=createLoot({rewardKey:'quest:'+quest.id,level:next.realLevel,source:lootSource,path:(await txn.getFirstAsync<{value:string}>("SELECT value FROM app_state WHERE key='game_master_profile'"))?.value?JSON.parse((await txn.getFirstAsync<{value:string}>("SELECT value FROM app_state WHERE key='game_master_profile'"))!.value).path:undefined,now});
      await txn.runAsync('INSERT INTO inventory_items(id,payload,acquired_at) VALUES (?,?,?)', loot.id, JSON.stringify(loot), now);
      const snapshot = await snapshotInTransaction(txn);
      result = { awarded: true, ...snapshot, loot, receipt: rewardReceipt(event.id, player, snapshot.player,
        snapshot.awakeningAwarded ? ['AWAKENED'] : [], snapshot.awakeningAwarded) };
    });
    if (!result) throw new Error('Nie udało się potwierdzić zapisu misji.');
    return result;
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
export function finishOnboarding(name: string, gameMasterProfile?: { goal: string; path: 'DISCIPLINE'|'MOTION'|'FOCUS' }) {
  const displayName = systemName(name);
  const safeProfile = gameMasterProfile ? { goal: gameMasterProfile.goal.trim().slice(0,120), path: gameMasterProfile.path } : null;
  return profileTransaction(async txn => {
    const marker = await txn.getFirstAsync<{ value: string }>('SELECT value FROM app_state WHERE key = ?', 'onboarding_complete');
    if (marker?.value === 'true') return snapshotInTransaction(txn);
    const player = await readPlayer(txn);
    await txn.runAsync('UPDATE app_state SET value = ? WHERE key = ?', JSON.stringify({ ...player, displayName }), 'player');
    if (safeProfile) await txn.runAsync("INSERT INTO app_state(key,value) VALUES ('game_master_profile',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", JSON.stringify(safeProfile));
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
    for (const table of ['social_history', 'reward_claims', 'inventory_items', 'quest_attempts', 'story_events', 'story_progress', 'boss_progress', 'daily_instances', 'daily_sets', 'protocol_bonuses', 'verified_events', 'quest_completions', 'chapter_completions', 'discovered_sectors', 'world_signals', 'app_state']) await txn.runAsync(`DELETE FROM ${table}`);
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

export function loadSocialSessions(): Promise<Partial<Record<SocialMode, SocialSession>>> {
  return serialized(async () => {
    await initSystemDatabase();
    const row = await (await getDatabase()).getFirstAsync<{ value:string }>("SELECT value FROM app_state WHERE key='social_sessions'");
    if (!row?.value) return {};
    try { return JSON.parse(row.value) as Partial<Record<SocialMode, SocialSession>>; } catch { return {}; }
  });
}
export function saveSocialSession(session: SocialSession): Promise<Partial<Record<SocialMode, SocialSession>>> {
  return profileTransaction(async txn => {
    const row = await txn.getFirstAsync<{ value:string }>("SELECT value FROM app_state WHERE key='social_sessions'");
    let sessions: Partial<Record<SocialMode, SocialSession>> = {};
    try { sessions = row?.value ? JSON.parse(row.value) : {}; } catch { sessions = {}; }
    sessions = { ...sessions, [session.mode]: session };
    await txn.runAsync("INSERT INTO app_state(key,value) VALUES ('social_sessions',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", JSON.stringify(sessions));
    return sessions;
  });
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

export function loadInventory(): Promise<InventoryItem[]> { return profileTransaction(async txn => { const rows=await txn.getAllAsync<{payload:string}>('SELECT payload FROM inventory_items ORDER BY acquired_at DESC,id'); return rows.map(r=>JSON.parse(r.payload) as InventoryItem); }); }
export function equipInventoryItem(id:string): Promise<InventoryItem[]> { return profileTransaction(async txn => { const player=await readPlayer(txn);const rows=await txn.getAllAsync<{payload:string}>('SELECT payload FROM inventory_items ORDER BY acquired_at DESC,id'); const items=rows.map(r=>JSON.parse(r.payload) as InventoryItem); if(!items.some(i=>i.id===id)) throw new Error('Przedmiot nie istnieje.'); const next=equipItem(items,id,player.realLevel); for(const item of next) await txn.runAsync('UPDATE inventory_items SET payload=? WHERE id=?',JSON.stringify(item),item.id); return next; }); }
export function unequipInventoryItem(id:string): Promise<InventoryItem[]> { return profileTransaction(async txn => { const rows=await txn.getAllAsync<{payload:string}>('SELECT payload FROM inventory_items ORDER BY acquired_at DESC,id');const items=rows.map(r=>JSON.parse(r.payload) as InventoryItem);const next=unequipItem(items,id);for(const item of next)await txn.runAsync('UPDATE inventory_items SET payload=? WHERE id=?',JSON.stringify(item),item.id);return next;});}
export function loadLootHistory(limit=50):Promise<InventoryItem[]>{return profileTransaction(async txn=>{const rows=await txn.getAllAsync<{payload:string}>('SELECT payload FROM inventory_items ORDER BY acquired_at DESC,id LIMIT ?',Math.max(1,Math.min(200,limit)));return rows.map(r=>JSON.parse(r.payload) as InventoryItem);});}
export function loadSocialHistory():Promise<SocialHistoryEntry[]>{return profileTransaction(async txn=>{const rows=await txn.getAllAsync<{payload:string}>('SELECT payload FROM social_history ORDER BY completed_at DESC,session_id LIMIT 100');return rows.map(r=>JSON.parse(r.payload) as SocialHistoryEntry);});}
export function claimCompletedSocialSession(session:SocialSession):Promise<{session:SocialSession;loot:InventoryItem|null;xpAwarded:number;achievements:string[]}>{
 return profileTransaction(async txn=>{
   if(session.state!=='COMPLETE'||!session.reward)throw new Error('Sesja nie jest ukończona.');
   const now=new Date().toISOString(),key=session.reward.id;
   const claim=await txn.runAsync('INSERT INTO reward_claims(reward_key,payload,claimed_at) VALUES (?,?,?) ON CONFLICT(reward_key) DO NOTHING',key,JSON.stringify(session.reward),now);
   if(claim.changes===0)return{session:claimSocialReward(session),loot:null,xpAwarded:0,achievements:socialAchievements((await txn.getAllAsync<{payload:string}>('SELECT payload FROM social_history')).map(r=>JSON.parse(r.payload)))};
   const before=await readPlayer(txn);const next=addRealXp(before,session.reward.xp);await txn.runAsync('UPDATE app_state SET value=? WHERE key=?',JSON.stringify({...next,updatedAt:now}),'player');
   const loot=createLoot({rewardKey:key,level:next.realLevel,source:session.reward.lootSource,now});
   await txn.runAsync('INSERT INTO inventory_items(id,payload,acquired_at) VALUES (?,?,?)',loot.id,JSON.stringify(loot),now);
   const claimed=claimSocialReward(session),entry=historyEntry(claimed);
   if(entry)await txn.runAsync('INSERT INTO social_history(session_id,mode,payload,completed_at) VALUES (?,?,?,?) ON CONFLICT(session_id) DO NOTHING',entry.sessionId,entry.mode,JSON.stringify(entry),entry.completedAt);
   const row=await txn.getFirstAsync<{value:string}>("SELECT value FROM app_state WHERE key='social_sessions'");let sessions:Partial<Record<SocialMode,SocialSession>>={};try{sessions=row?.value?JSON.parse(row.value):{};}catch{}sessions={...sessions,[claimed.mode]:claimed};await txn.runAsync("INSERT INTO app_state(key,value) VALUES ('social_sessions',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",JSON.stringify(sessions));
   const history=(await txn.getAllAsync<{payload:string}>('SELECT payload FROM social_history')).map(r=>JSON.parse(r.payload) as SocialHistoryEntry);
   return{session:claimed,loot,xpAwarded:session.reward.xp,achievements:socialAchievements(history)};
 });
}

export function setGuardianApproval(status:'PENDING'|'APPROVED'|'REJECTED') { return profileTransaction(async txn=>{ const value={status,updatedAt:new Date().toISOString()}; await txn.runAsync("INSERT INTO app_state(key,value) VALUES ('guardian_approval',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",JSON.stringify(value)); return snapshotInTransaction(txn); }); }
