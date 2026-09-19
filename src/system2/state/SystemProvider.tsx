import { resetTesterProfile } from '../tester/reset';
import { AppState } from 'react-native';
import { configureAudio, playFeedback, rewardSound, stopAudio } from '../identity/audio';
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
import { loadAchievementsState, loadTitlesState } from '../achievements/storage';
import { flushCloudOutbox } from '../cloud/sync';

type SystemContextValue = db.SystemSnapshot & {
  ready: boolean; error: string | null; activeQuestId: string | null;
  setActiveQuestId: Dispatch<SetStateAction<string | null>>;
  acknowledgeAwakening: () => Promise<void>;
  completeVerifiedQuest: (input: db.CompleteQuestInput) => Promise<db.CompleteQuestResult>;
  refreshPlayer: () => Promise<void>;
  finishOnboarding: (name: string, birthDate?: string) => Promise<void>;
  updateIdentity: (patch: Parameters<typeof db.updateIdentity>[0]) => Promise<void>;
  saveSettings: (settings: Settings) => Promise<void>;
  resetData: (confirmed: true) => Promise<void>;
  presentReward: (receipt: RewardReceipt) => void;
  celebration: RewardReceipt | null; dismissCelebration: () => void;
  lastReward: RewardReceipt | null; notificationError: string | null;
  achievementState: PlayerAchievementState;
  achievementError: string | null;
  refreshAchievements: () => Promise<void>;
};
const EMPTY_ACHIEVEMENT_STATE: PlayerAchievementState = { achievements: {}, titles: { titles: {}, activeTitleId: null }, lastEvaluatedAt: '' };
const SystemContext = createContext<SystemContextValue | null>(null);
export function SystemProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<db.SystemSnapshot>(() => ({
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
  const seenRewards = useRef(new Set<string>());
  const refreshRef = useRef<Promise<void> | null>(null);
  const generation = useRef(0);
  const resetting = useRef(false);
  useEffect(() => { configureAudio(snapshot.settings.audio); return stopAudio; }, [snapshot.settings.audio]);
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
      await awaitWithTimeout(reconcileAchievements(player));
      if (epoch === generation.current) await loadAchievements(epoch);
    } catch (cause) {
      if (epoch === generation.current) setAchievementError('Nie udało się odświeżyć osiągnięć. Spróbuj ponownie.');
      if (__DEV__) console.error('Achievement sync failed', cause);
    }
  }, [loadAchievements]);
  const refreshAchievements = useCallback(async (): Promise<void> => {
    if (!resetting.current) await syncAchievements(snapshot.player, generation.current);
  }, [snapshot.player, syncAchievements]);
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
        if (epoch === generation.current) { configureHaptics(next.settings.haptics); setSnapshot(next); void syncAchievements(next.player, epoch); setReady(true); void flushCloudOutbox().catch(() => undefined); }
      } catch (cause) {
        if (epoch === generation.current) { setReady(false); setError(cause instanceof Error ? cause.message : 'Nie można odczytać danych SYSTEMU. Spróbuj ponownie.'); if (__DEV__) console.error(cause); }
      } finally { if (epoch === generation.current) refreshRef.current = null; }
    })();
    refreshRef.current = operation; return operation;
  }, [syncAchievements]);
  useEffect(() => { void refreshPlayer(); }, [refreshPlayer]);
  useEffect(() => {
    let currentDay = dayKey();
    const sub = AppState.addEventListener('change', state => { if (state === 'active') { currentDay = dayKey(); void refreshPlayer(); } else stopAudio(); });
    const interval = setInterval(() => { const next = dayKey(); if (AppState.currentState === 'active' && next !== currentDay) { currentDay = next; void refreshPlayer(); } }, 30000);
    return () => { sub.remove(); clearInterval(interval); stopAudio(); };
  }, [refreshPlayer]);
  const presentReward = useCallback((receipt: RewardReceipt) => {
    if (seenRewards.current.has(receipt.id)) return;
    seenRewards.current.add(receipt.id);
    if (seenRewards.current.size > 128) seenRewards.current.delete(seenRewards.current.values().next().value!);
    playFeedback(rewardSound(receipt));
    setLastReward(receipt);
    if (receipt.afterLevel > receipt.beforeLevel || receipt.skillLevels.length) setCelebration(receipt);
  }, []);
  const dismissCelebration = useCallback(() => setCelebration(null), []);
  const completeVerifiedQuest = useCallback(async (input: db.CompleteQuestInput) => {
    if (resetting.current) throw new Error('Trwa reset SYSTEMU.');
    const epoch = ++generation.current; refreshRef.current = null;
    const result = await db.completeVerifiedQuest(input);
    if (epoch === generation.current) { setSnapshot(result); void flushCloudOutbox().catch(() => undefined); void syncAchievements(result.player, epoch); if (result.receipt) presentReward(result.receipt); }
    return result;
  }, [presentReward, syncAchievements]);
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
    setReady(false); setError(null); setActiveQuestId(null); setCelebration(null); setLastReward(null);
    try {
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
    saveSettings: settings => apply(() => db.saveSettings(settings)), resetData, achievementState, achievementError, refreshAchievements,
    acknowledgeAwakening: async () => { await awaitWithTimeout(db.acknowledgeAwakening()); setSnapshot(current => ({ ...current, awakeningPending: false })); },
  }}>{children}</SystemContext.Provider>;
}
export function useSystem() {
  const context = useContext(SystemContext);
  if (!context) throw new Error('useSystem musi działać wewnątrz SystemProvider.');
  return context;
}
