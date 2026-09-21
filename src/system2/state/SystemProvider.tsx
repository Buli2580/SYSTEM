import { resetTesterProfile } from '../tester/reset';
import { AppState } from 'react-native';
import { syncReminders } from '../notifications/service';
import { dayKey } from '../daily/calendar';
import { createContext, type ReactNode, type Dispatch, type SetStateAction, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createNewPlayer } from '../core';
import * as db from '../storage/database';
import { awaitWithTimeout } from '../storage/awaitWithTimeout';
import { DEFAULT_SETTINGS, type Settings } from '../identity/model';
import { configureHaptics } from '../identity/feedback';
import { removeAllAvatars } from '../identity/avatar';
import type { RewardReceipt } from '../core/rewards';
import type { PlayerAchievementState } from '../achievements/types';
import { reconcileAchievements } from '../achievements/reconcile';
import { ACHIEVEMENTS } from '../achievements/catalog';
import { loadAchievementsState, loadTitlesState } from '../achievements/storage';
import { flushCloudOutbox } from '../cloud/sync';
import { stopQuestBackgroundTracking } from '../background/locationService';
import { requestDailyAIGameMaster, type AIGameMasterResponse } from '../ai';
import { PresentationEventPresets, presentationEventBus } from '../presentation/PresentationEvents';

type SystemContextValue = db.SystemSnapshot & {
  createPlayerGoal: (input: Parameters<typeof db.createPlayerGoal>[0]) => Promise<void>;
  updateGoalStatus: (id: string, status: Parameters<typeof db.updateGoalStatus>[1]) => Promise<void>;
  rerollDailyQuest: (id: string) => Promise<void>;
  ready: boolean; error: string | null; activeQuestId: string | null;
  setActiveQuestId: Dispatch<SetStateAction<string | null>>;
  acknowledgeAwakening: () => Promise<void>;
  completeVerifiedQuest: (input: db.CompleteQuestInput) => Promise<db.CompleteQuestResult>;
  refreshPlayer: () => Promise<void>;
  finishOnboarding: (name: string, birthDate?: string) => Promise<void>;
  updateIdentity: (patch: Parameters<typeof db.updateIdentity>[0]) => Promise<void>;
  saveSettings: (settings: Settings) => Promise<void>;
  resetData: (confirmed: true) => Promise<void>;
  presentReward: (receipt: RewardReceipt, presentationKind?: 'quest' | 'boss') => void;
  celebration: RewardReceipt | null; dismissCelebration: () => void;
  lastReward: RewardReceipt | null; notificationError: string | null;
  achievementState: PlayerAchievementState;
  achievementError: string | null;
  refreshAchievements: () => Promise<void>;
  aiGameMaster: AIGameMasterResponse | null; aiLoading: boolean; aiError: string | null;
  refreshAIGameMaster: () => Promise<void>;
};
const EMPTY_ACHIEVEMENT_STATE: PlayerAchievementState = { achievements: {}, titles: { titles: {}, activeTitleId: null }, lastEvaluatedAt: '' };
const SystemContext = createContext<SystemContextValue | null>(null);
export function SystemProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<db.SystemSnapshot>(() => ({
    systemDebt: 0, aiDaily: null,
    goals: [], journeys: [], journeyQuestIds: {}, recentActivity: [], progression: null,
    story: null, daily: null, player: createNewPlayer(), completedQuestIds: [], awakeningCompleted: false, worldUnlocked: false,
    awakeningPending: false, onboardingComplete: false, settings: DEFAULT_SETTINGS, titles: ['UNAWAKENED'],
  }));
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const [achievementError, setAchievementError] = useState<string | null>(null);
  const [achievementState, setAchievementState] = useState<PlayerAchievementState>(EMPTY_ACHIEVEMENT_STATE);
  const [activeQuestId, setActiveQuestId] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<RewardReceipt | null>(null);
  const [lastReward, setLastReward] = useState<RewardReceipt | null>(null);
  const [aiGameMaster, setAIGameMaster] = useState<AIGameMasterResponse | null>(null);
  const [aiLoading, setAILoading] = useState(false);
  const [aiError, setAIError] = useState<string | null>(null);
  const seenRewards = useRef(new Set<string>());
  const refreshRef = useRef<Promise<void> | null>(null);
  const generation = useRef(0);
  const resetting = useRef(false);
  const aiDayRef = useRef<string | null>(null);
  useEffect(() => {
    if (!ready) return;
    let active = true;
    void awaitWithTimeout(syncReminders(snapshot.settings, snapshot.daily?.clear ?? false, snapshot.awakeningCompleted && !snapshot.daily?.clockAnomaly))
      .then(() => { if (active) setNotificationError(null); })
      .catch(() => { if (active) setNotificationError('Nie udało się odświeżyć przypomnień. Ponów zapis w ustawieniach.'); });
    return () => { active = false; };
  }, [ready, snapshot.settings.dailyReminder, snapshot.settings.reminderTime, snapshot.daily?.dayKey, snapshot.daily?.clear, snapshot.daily?.clockAnomaly, snapshot.awakeningCompleted]);
  useEffect(() => { configureHaptics(snapshot.settings.haptics); }, [snapshot.settings.haptics]);
  const loadAchievements = useCallback(async (epoch: number): Promise<void> => {
    const [achievements, titles] = await awaitWithTimeout(Promise.all([loadAchievementsState(), loadTitlesState()]));
    if (epoch !== generation.current) return;
    setAchievementState({ achievements: Object.fromEntries(Object.entries(achievements).map(([id, item]) => [id, { achievementId: id, ...item }])), titles, lastEvaluatedAt: new Date().toISOString() });
    setAchievementError(null);
  }, []);
  const syncAchievements = useCallback(async (player: db.SystemSnapshot['player'], epoch: number): Promise<void> => {
    try {
      const result = await awaitWithTimeout(reconcileAchievements(player));
      if (epoch === generation.current) {
        for (const id of result.newlyUnlocked) {
          const definition = ACHIEVEMENTS.find(item => item.id === id);
          if (definition) {
            presentationEventBus.emit(PresentationEventPresets.achievementUnlocked(
              definition.id,
              definition.name,
              definition.tier ?? 'COMMON',
            ));
          }
        }
        await loadAchievements(epoch);
      }
    } catch (cause) {
      if (epoch === generation.current) setAchievementError('Nie udało się odświeżyć osiągnięć. Spróbuj ponownie.');
      if (__DEV__) console.error('Achievement sync failed', cause);
    }
  }, [loadAchievements]);
  const refreshAchievements = useCallback(async (): Promise<void> => {
    if (!resetting.current) await syncAchievements(snapshot.player, generation.current);
  }, [snapshot.player, syncAchievements]);

  const runAIGameMaster = useCallback(async (next: db.SystemSnapshot, epoch: number, force = false) => {
    const day = next.daily?.dayKey;
    if (!next.awakeningCompleted || !day || next.daily?.clockAnomaly || resetting.current) return;
    // Once a canonical AI loadout is persisted for a day it is immutable. Manual refresh may retry only before a plan is accepted.
    if (next.aiDaily?.dayKey === day) {
      aiDayRef.current = day;
      setAIError(null);
      setAIGameMaster({
        quests: [],
        director: next.aiDaily.director,
        briefing: next.aiDaily.briefing,
        source: next.aiDaily.source,
        ...(next.aiDaily.model ? { model: next.aiDaily.model } : {}),
      });
      return;
    }
    if (!force && aiDayRef.current === day) return;
    aiDayRef.current = day;
    setAILoading(true);
    setAIError(null);
    try {
      const response = await requestDailyAIGameMaster(next);
      if (epoch !== generation.current || resetting.current) return;
      setAIGameMaster(response);
      if (response.source === 'ai') {
        const applied = await awaitWithTimeout(db.applyAIDailyPlan(response));
        if (epoch === generation.current && !resetting.current) setSnapshot(applied);
      }
    } catch (cause) {
      if (epoch === generation.current && !resetting.current) {
        const message = cause instanceof Error ? cause.message : 'AI GAME MASTER jest chwilowo niedostępny.';
        setAIError(message);
        presentationEventBus.emit(PresentationEventPresets.systemWarning(message, 'AI_GAME_MASTER'));
      }
    } finally {
      if (epoch === generation.current) setAILoading(false);
    }
  }, []);

  const refreshAIGameMaster = useCallback(async () => {
    aiDayRef.current = null;
    await runAIGameMaster(snapshot, generation.current, true);
  }, [runAIGameMaster, snapshot]);
  const refreshPlayer = useCallback((): Promise<void> => {
    if (resetting.current) return Promise.resolve();
    if (refreshRef.current) return refreshRef.current;
    const epoch = generation.current;
    const operation = (async () => {
      try {
        setError(null);
        if (await awaitWithTimeout(db.hasAvatarCleanupPending())) {
          removeAllAvatars(); await awaitWithTimeout(db.acknowledgeAvatarCleanup());
        }
        const next = await awaitWithTimeout(db.loadSystemState());
        const health = await awaitWithTimeout(db.testerHealthCheck());
        if (!health.ok) throw new Error('Kontrola zapisu SYSTEMU: ' + health.issues.map(issue => issue.code).join(', '));
        if (epoch === generation.current) { configureHaptics(next.settings.haptics); setSnapshot(next); void syncAchievements(next.player, epoch); setReady(true); void flushCloudOutbox().catch(() => undefined); void runAIGameMaster(next, epoch); }
      } catch (cause) {
        if (epoch === generation.current) {
          const message = cause instanceof Error ? cause.message : 'Nie można odczytać danych SYSTEMU. Spróbuj ponownie.';
          setReady(false);
          setError(message);
          presentationEventBus.emit(PresentationEventPresets.systemError(message, 'SYSTEM_STATE'));
          if (__DEV__) console.error(cause);
        }
      } finally { if (epoch === generation.current) refreshRef.current = null; }
    })();
    refreshRef.current = operation; return operation;
  }, [runAIGameMaster, syncAchievements]);
  useEffect(() => { void refreshPlayer(); }, [refreshPlayer]);
  useEffect(() => {
    let currentDay = dayKey();
    const sub = AppState.addEventListener('change', state => { if (state === 'active') { currentDay = dayKey(); void refreshPlayer(); } });
    const interval = setInterval(() => { const next = dayKey(); if (AppState.currentState === 'active' && next !== currentDay) { currentDay = next; void refreshPlayer(); } }, 30000);
    return () => { sub.remove(); clearInterval(interval); };
  }, [refreshPlayer]);
  const presentReward = useCallback((receipt: RewardReceipt, presentationKind: 'quest' | 'boss' = 'quest') => {
    if (seenRewards.current.has(receipt.id)) return;
    seenRewards.current.add(receipt.id);
    if (seenRewards.current.size > 128) seenRewards.current.delete(seenRewards.current.values().next().value!);
    if (presentationKind === 'quest') {
      presentationEventBus.emit(PresentationEventPresets.questComplete(receipt.id, 'QUEST COMPLETE', receipt));
    }
    if (receipt.realXp > 0) presentationEventBus.emit(PresentationEventPresets.xpGain(receipt.realXp, presentationKind));
    presentationEventBus.emit(PresentationEventPresets.rewardReceived(receipt));
    if (receipt.afterLevel > receipt.beforeLevel) {
      presentationEventBus.emit(PresentationEventPresets.levelUp(receipt.beforeLevel, receipt.afterLevel, receipt.afterRank));
    }
    setLastReward(receipt);
    if (receipt.afterLevel > receipt.beforeLevel || receipt.skillLevels.length) setCelebration(receipt);
  }, []);
  const dismissCelebration = useCallback(() => setCelebration(null), []);
  const completeVerifiedQuest = useCallback(async (input: db.CompleteQuestInput) => {
    if (resetting.current) throw new Error('Trwa reset SYSTEMU.');
    const previousStreak = snapshot.player.streak;
    const previousBossDamage = snapshot.story?.bossSupportDamage ?? 0;
    const previousBoss = snapshot.story?.boss ?? null;
    const previousBossComplete = snapshot.story?.bossComplete ?? false;
    const epoch = ++generation.current; refreshRef.current = null;
    const result = await db.completeVerifiedQuest(input);
    if (epoch === generation.current) {
      setSnapshot(result);

      if (result.player.streak !== previousStreak) {
        presentationEventBus.emit(PresentationEventPresets.streakUpdated(result.player.streak));
        for (const milestone of [3, 7, 14, 30, 60, 100]) {
          if (previousStreak < milestone && result.player.streak >= milestone) {
            presentationEventBus.emit(PresentationEventPresets.streakMilestone(milestone));
          }
        }
      }

      const nextBossDamage = result.story?.bossSupportDamage ?? 0;
      if (nextBossDamage > previousBossDamage) {
        presentationEventBus.emit(PresentationEventPresets.bossDamage(
          result.story?.boss?.id ?? 'the_first_wall_v1',
          nextBossDamage - previousBossDamage,
          result.story?.bossHp ?? 0,
        ));
      }

      const nextBoss = result.story?.boss ?? null;
      if (!previousBoss?.focus_at && nextBoss?.focus_at) {
        presentationEventBus.emit(PresentationEventPresets.bossPhaseChanged(nextBoss.id, 1, 'FOCUS COMPLETE'));
      }
      if (!previousBoss?.move_at && nextBoss?.move_at) {
        presentationEventBus.emit(PresentationEventPresets.bossPhaseChanged(nextBoss.id, 2, 'MOVEMENT COMPLETE'));
      }
      if (!previousBoss?.discipline_at && nextBoss?.discipline_at) {
        presentationEventBus.emit(PresentationEventPresets.bossPhaseChanged(nextBoss.id, 3, 'DISCIPLINE COMPLETE'));
      }
      const bossDefeatedNow = !previousBossComplete && Boolean(result.story?.bossComplete);
      if (bossDefeatedNow) {
        presentationEventBus.emit(PresentationEventPresets.bossDefeated(
          nextBoss?.id ?? 'the_first_wall_v1',
          'PIERWSZY MUR',
          result.receipt ?? null,
        ));
      }

      void syncAchievements(result.player, epoch);
      void flushCloudOutbox().catch(() => undefined);
      if (result.receipt) presentReward(result.receipt, bossDefeatedNow ? 'boss' : 'quest');
    }
    return result;
  }, [presentReward, snapshot.player.streak, snapshot.story, syncAchievements]);
  const apply = useCallback(async (operation: () => Promise<db.SystemSnapshot>) => {
    if (resetting.current) throw new Error('Trwa reset SYSTEMU.');
    const epoch = ++generation.current; refreshRef.current = null;
    const next = await awaitWithTimeout(operation());
    if (epoch === generation.current) { configureHaptics(next.settings.haptics); setSnapshot(next); void syncAchievements(next.player, epoch); }
  }, [syncAchievements]);
  const resetData = useCallback(async (confirmed: true) => {
    if (!__DEV__ || confirmed !== true) throw new Error('Reset developerski jest niedostępny.');
    if (resetting.current) return;
    resetting.current = true; const epoch = ++generation.current; refreshRef.current = null;
    setReady(false); setError(null); setActiveQuestId(null); setCelebration(null); setLastReward(null); setAIGameMaster(null); setAIError(null); aiDayRef.current = null;
    try {
      await stopQuestBackgroundTracking().catch(() => undefined);
      await awaitWithTimeout(resetTesterProfile('RESET TESTER PROFILE'));
      setAchievementState(EMPTY_ACHIEVEMENT_STATE); setAchievementError(null);
      removeAllAvatars(); await awaitWithTimeout(db.acknowledgeAvatarCleanup());
      const next = await awaitWithTimeout(db.loadSystemState());
      seenRewards.current.clear(); configureHaptics(next.settings.haptics); setSnapshot(next); void syncAchievements(next.player, epoch); setReady(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Nie udało się zakończyć resetu. Ponów odczyt SYSTEMU.'); throw cause; }
    finally { resetting.current = false; }
  }, [syncAchievements]);
  return <SystemContext.Provider value={{ ...snapshot, ready, error, activeQuestId, setActiveQuestId, refreshPlayer,
    completeVerifiedQuest, presentReward, celebration, lastReward, notificationError, dismissCelebration,
    finishOnboarding: (name, birthDate) => apply(() => db.finishOnboarding(name, birthDate)), updateIdentity: patch => apply(() => db.updateIdentity(patch)),
    createPlayerGoal: input => apply(() => db.createPlayerGoal(input)), updateGoalStatus: (id, status) => apply(() => db.updateGoalStatus(id, status)),
    rerollDailyQuest: id => apply(() => db.rerollDailyQuest(id)),
    saveSettings: settings => apply(() => db.saveSettings(settings)), resetData, achievementState, achievementError, refreshAchievements,
    aiGameMaster, aiLoading, aiError, refreshAIGameMaster,
    acknowledgeAwakening: async () => { await awaitWithTimeout(db.acknowledgeAwakening()); setSnapshot(current => ({ ...current, awakeningPending: false })); },
  }}>{children}</SystemContext.Provider>;
}
export function useSystem() {
  const context = useContext(SystemContext);
  if (!context) throw new Error('useSystem musi działać wewnątrz SystemProvider.');
  return context;
}
