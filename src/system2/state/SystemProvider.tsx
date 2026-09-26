import { AppState } from 'react-native';
import { configureAudio, playFeedback, rewardSound, stopAudio, stopMusic } from '../identity/audio';
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
import type { InventoryItem } from '../core/inventory';
import type { SocialMode, SocialSession } from '../core/social';

type SystemContextValue = db.SystemSnapshot & {
  ready: boolean; error: string | null; activeQuestId: string | null;
  setActiveQuestId: Dispatch<SetStateAction<string | null>>;
  acknowledgeAwakening: () => Promise<void>;
  completeVerifiedQuest: (input: db.CompleteQuestInput) => Promise<db.CompleteQuestResult>;
  refreshPlayer: () => Promise<void>;
  finishOnboarding: (name: string, gameMasterProfile?: { goal:string; path:'DISCIPLINE'|'MOTION'|'FOCUS' }) => Promise<void>;
  updateIdentity: (patch: Parameters<typeof db.updateIdentity>[0]) => Promise<void>;
  saveSettings: (settings: Settings) => Promise<void>;
  setGuardianApproval: (status:'PENDING'|'APPROVED'|'REJECTED') => Promise<void>;
  resetData: (confirmed: true) => Promise<void>;
  presentReward: (receipt: RewardReceipt) => void;
  celebration: RewardReceipt | null; dismissCelebration: () => void;
  lastReward: RewardReceipt | null; dismissLastReward: () => void; inventory: InventoryItem[]; refreshInventory: () => Promise<void>; equipItem: (id:string) => Promise<void>; unequipItem: (id:string) => Promise<void>; claimSocialSession: (session:SocialSession) => Promise<void>; notificationError: string | null; socialSessions: Partial<Record<SocialMode,SocialSession>>; saveSocialSession: (session:SocialSession) => Promise<void>;
};
const SystemContext = createContext<SystemContextValue | null>(null);
export function SystemProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<db.SystemSnapshot>(() => ({
    story: null, daily: null, player: createNewPlayer(), completedQuestIds: [], awakeningCompleted: false, worldUnlocked: false,
    awakeningPending: false, onboardingComplete: false, settings: DEFAULT_SETTINGS, titles: ['UNAWAKENED'],
    gameMasterProfile: null, recentAttempt: null, recentAttempts: [], guardianApproval: null,
  }));
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const [activeQuestId, setActiveQuestId] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<RewardReceipt | null>(null);
  const [lastReward, setLastReward] = useState<RewardReceipt | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [socialSessions, setSocialSessions] = useState<Partial<Record<SocialMode,SocialSession>>>({});
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
        if (epoch === generation.current) { configureHaptics(next.settings.haptics); setSnapshot(next); setInventory(await awaitWithTimeout(db.loadInventory())); setSocialSessions(await awaitWithTimeout(db.loadSocialSessions())); setReady(true); }
      } catch (cause) {
        if (epoch === generation.current) { setReady(false); setError('Nie można odczytać danych SYSTEMU. Spróbuj ponownie.'); if (__DEV__) console.error(cause); }
      } finally { if (epoch === generation.current) refreshRef.current = null; }
    })();
    refreshRef.current = operation; return operation;
  }, []);
  useEffect(() => { void refreshPlayer(); }, [refreshPlayer]);
  useEffect(() => {
    let currentDay = dayKey();
    const sub = AppState.addEventListener('change', state => { if (state === 'active') { currentDay = dayKey(); void refreshPlayer(); } else { stopAudio(); stopMusic(); } });
    const interval = setInterval(() => { const next = dayKey(); if (AppState.currentState === 'active' && next !== currentDay) { currentDay = next; void refreshPlayer(); } }, 30000);
    return () => { sub.remove(); clearInterval(interval); stopAudio(); stopMusic(); };
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
  const dismissLastReward = useCallback(() => setLastReward(null), []);
  const completeVerifiedQuest = useCallback(async (input: db.CompleteQuestInput) => {
    const epoch = generation.current;
    const result = await db.completeVerifiedQuest(input);
    if (epoch === generation.current) { setSnapshot(result); if (result.loot) setInventory(current => current.some(i=>i.id===result.loot!.id)?current:[result.loot!,...current]); if (result.receipt) presentReward(result.receipt); }
    return result;
  }, [presentReward]);
  const apply = useCallback(async (operation: Promise<db.SystemSnapshot>) => {
    const epoch = generation.current;
    const next = await awaitWithTimeout(operation);
    if (epoch === generation.current) { configureHaptics(next.settings.haptics); setSnapshot(next); }
  }, []);
  const resetData = useCallback(async (confirmed: true) => {
    if (resetting.current) return;
    resetting.current = true; generation.current++; refreshRef.current = null;
    setReady(false); setError(null); setActiveQuestId(null); setCelebration(null); setLastReward(null);
    try {
      await awaitWithTimeout(db.resetSystemData(confirmed));
      removeAllAvatars(); await awaitWithTimeout(db.acknowledgeAvatarCleanup());
      const next = await awaitWithTimeout(db.loadSystemState());
      seenRewards.current.clear(); configureHaptics(next.settings.haptics); setSnapshot(next); setInventory([]); setSocialSessions({}); setReady(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Nie udało się zakończyć resetu. Ponów odczyt SYSTEMU.'); throw cause; }
    finally { resetting.current = false; }
  }, []);
  const refreshInventory=useCallback(async()=>setInventory(await awaitWithTimeout(db.loadInventory())),[]);
  const equipItem=useCallback(async(id:string)=>setInventory(await awaitWithTimeout(db.equipInventoryItem(id))),[]);
  const unequipItem=useCallback(async(id:string)=>setInventory(await awaitWithTimeout(db.unequipInventoryItem(id))),[]);
  const claimSocialSession=useCallback(async(session:SocialSession)=>{const result=await awaitWithTimeout(db.claimCompletedSocialSession(session));setInventory(await awaitWithTimeout(db.loadInventory()));setSocialSessions(current=>({...current,[result.session.mode]:result.session}));await refreshPlayer();},[refreshPlayer]);
  const saveSocialSession=useCallback(async(session:SocialSession)=>setSocialSessions(await awaitWithTimeout(db.saveSocialSession(session))),[]);
  return <SystemContext.Provider value={{ ...snapshot, ready, error, activeQuestId, setActiveQuestId, refreshPlayer, inventory, refreshInventory, equipItem, unequipItem, claimSocialSession, socialSessions, saveSocialSession,
    completeVerifiedQuest, presentReward, celebration, lastReward, notificationError, dismissCelebration, dismissLastReward,
    finishOnboarding: (name, gameMasterProfile) => apply(db.finishOnboarding(name, gameMasterProfile)), updateIdentity: patch => apply(db.updateIdentity(patch)),
    saveSettings: settings => apply(db.saveSettings(settings)),
    setGuardianApproval: status => apply(db.setGuardianApproval(status)), resetData,
    acknowledgeAwakening: async () => { await awaitWithTimeout(db.acknowledgeAwakening()); setSnapshot(current => ({ ...current, awakeningPending: false })); },
  }}>{children}</SystemContext.Provider>;
}
export function useSystem() {
  const context = useContext(SystemContext);
  if (!context) throw new Error('useSystem musi działać wewnątrz SystemProvider.');
  return context;
}
