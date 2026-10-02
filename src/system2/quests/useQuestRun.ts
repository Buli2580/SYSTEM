import type { InventoryItem } from '../core/inventory';
import type { AttemptResult, AttemptReason } from '../story/types';
import { createActivityWindow, mergeActivityFeatures } from '../activity/features';
import { classifyActivity, verdictMessage } from '../activity/classifier';
import type { ActivityEvidence, ActivityFeatures } from '../activity/types';
import type { RewardReceipt } from '../core/rewards';
import { awaitWithTimeout } from '../storage/awaitWithTimeout';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Haptics from '../identity/feedback';
import { playFeedback } from '../identity/audio';
import * as Location from 'expo-location';
import type { RunnableQuest, QuestEvidence } from './types';
import { createFocusTimer } from '../verification/timer';
import { distanceBetween, isUsableLocation, verifiedSegment, verificationScoreForAccuracy } from '../verification/gps';
import {EMPTY_GPS_RISK,inspectGpsRisk,mergeRiskSnapshots,type GpsRiskSnapshot} from '../verification/sessionRisk';
import { getQuestAccess, recordActivityAttempt, beginQuestAttempt, endQuestAttempt, loadQuestCheckpoint, saveQuestCheckpoint, clearQuestCheckpoint, loadBackgroundQuestSession, type QuestCheckpoint } from '../storage/database';
import { buildEvidence } from '../verification/evidence';
import { useSystem } from '../state/SystemProvider';
import {
  handoffQuestToBackground,
  markQuestForeground,
  prepareQuestBackgroundTracking,
  requestBackgroundLocationAccess,
  stopQuestBackgroundTracking,
} from '../background/locationService';
import { confirmBackgroundLocationDisclosure } from '../background/disclosure';

type RunStatus = 'CHECKING' | 'READY' | 'STARTING' | 'TRACKING' | 'COMPLETING' | 'COMPLETED' | 'DENIED' | 'ERROR' | 'LOCKED';

export function useQuestRun(quest: RunnableQuest) {
  const isTimer = quest.verification.type === 'TIMER';
  const hasTimer = quest.verification.type !== 'GPS_DISTANCE';
  const targetSeconds = quest.verification.type !== 'GPS_DISTANCE' ? quest.verification.minimumDurationSeconds : 0;
  const { gameLoop, completeVerifiedQuest, ready, error: databaseError, refreshPlayer, setActiveQuestId, daily } = useSystem();
  const [status, setStatus] = useState<RunStatus>('CHECKING');
  const [error, setError] = useState<string | null>(null);
  const [distance, setDistance] = useState(0);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [duration, setDuration] = useState(0);
  const [receipt, setReceipt] = useState<RewardReceipt | null>(null);
  const [loot, setLoot] = useState<InventoryItem | null>(null);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const watcherRef = useRef<Location.LocationSubscription | null>(null);
  const trackingActiveRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof createFocusTimer> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const lastPointRef = useRef<Location.LocationObject | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const lastFixTimeRef = useRef(0);
  const distanceRef = useRef(0);
  const scoreRef = useRef(100);
  const sessionRef = useRef(0);
  const focusedRef = useRef(false);
  const statusRef = useRef<RunStatus>('CHECKING');
  const startupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingHandoffRef = useRef<Promise<void> | null>(null);
  const backgroundHandoffRef = useRef(false);
  const resumeStartupRef = useRef(false);
  const startQuestRef = useRef<() => Promise<void>>(async () => {});
  const startupPhaseRef = useRef('idle');
  const traceStartup = useCallback((phase: string) => {
    startupPhaseRef.current = phase;
    // Deliberately excludes coordinates, profile data and native error payloads.
    console.info('[SYSTEM quest lifecycle]', JSON.stringify({ questId: quest.id, phase,
      status: statusRef.current, session: sessionRef.current, appState: AppState.currentState,
      focused: focusedRef.current }));
  }, [quest.id]);
  const backgroundSessionActiveRef = useRef(false);
  const riskRef = useRef<GpsRiskSnapshot>(EMPTY_GPS_RISK);
  const [antiCheatRisk,setAntiCheatRisk]=useState<GpsRiskSnapshot>(EMPTY_GPS_RISK);

  const activityWindow = useRef<ReturnType<typeof createActivityWindow> | null>(null);
  const activityBaseRef = useRef<ActivityFeatures | null>(null);
  const activityRef = useRef<ActivityEvidence | null>(null);
  const checkpointRef = useRef<QuestCheckpoint | null>(null);
  const checkpointWriteRef = useRef({ distance: 0, at: 0 });
  const [activity, setActivity] = useState<ActivityEvidence | null>(null);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [extendedGoal, setExtendedGoal] = useState(false);
  const extendedRef = useRef(false);
  const attemptRef = useRef<string | null>(null);
  const trackingSince = useRef<number | null>(null);
  const pendingEnd = useRef<Parameters<typeof endQuestAttempt> | null>(null);
  const endWrite = useRef<Promise<void> | null>(null);
  const flushAttempt = useCallback(async () => {
    if (endWrite.current) return endWrite.current;
    const record = pendingEnd.current;
    if (!record) return;
    const work = endQuestAttempt(...record).then(() => { if (pendingEnd.current === record) pendingEnd.current = null; });
    endWrite.current = work;
    try { await work; } finally { endWrite.current = null; }
  }, []);
  const endAttempt = useCallback((result: Exclude<AttemptResult,'COMPLETED'>, reason: AttemptReason) => {
    const id = attemptRef.current; if (!id) return;
    attemptRef.current = null;
    const seconds = trackingSince.current === null ? 0 : Math.max(0,(performance.now()-trackingSince.current)/1000);
    pendingEnd.current = [id,result,reason,seconds,distanceRef.current];
    void flushAttempt().then(() => refreshPlayer()).catch(() => undefined); // retry writing before any next attempt
  }, [flushAttempt, refreshPlayer]);

  const persistCheckpoint = useCallback(async (force = false) => {
    if (isTimer ? (timerRef.current?.sample().seconds ?? 0) <= 0 : distanceRef.current <= 0) return;
    const now = Date.now();
    if (!force && distanceRef.current - checkpointWriteRef.current.distance < 10 &&
        now - checkpointWriteRef.current.at < 5000) return;
    const checkpoint: QuestCheckpoint = {
      questId: quest.id,
      distanceMeters: distanceRef.current,
      durationSeconds: Math.max(
        0,
        activityRef.current?.features.durationSeconds ??
          timerRef.current?.sample().seconds ??
          checkpointRef.current?.durationSeconds ??
          0,
      ),
      verificationScore: activityRef.current?.verificationScore ?? scoreRef.current,
      extendedGoal: extendedRef.current,
      ...(activityRef.current ? { activityFeatures: activityRef.current.features } : {}),
      updatedAt: new Date(now).toISOString(),
    };
    checkpointRef.current = checkpoint;
    checkpointWriteRef.current = { distance: checkpoint.distanceMeters, at: now };
    await saveQuestCheckpoint(checkpoint);
  }, [quest.id, quest.verification.type, isTimer]);
  const chooseExtendedGoal = (value:boolean) => {
    if (statusRef.current !== 'READY' || quest.category !== 'DAILY' || !quest.activityType) return;
    extendedRef.current = value; setExtendedGoal(value);
  };

  const transition = useCallback((next: RunStatus) => {
    statusRef.current = next;
    setStatus(next);
    gameLoop?.observeQuest(next, quest.id);
    traceStartup(next);
  }, [traceStartup, gameLoop?.observeQuest, quest.id]);

  const stopVerification = useCallback(() => {
    if (statusRef.current === 'STARTING') traceStartup('invalidate-start');
    // Also invalidates pending permissions / a watch promise without a handle yet.
    sessionRef.current += 1;
    setActiveQuestId(current => current === quest.id ? null : current);
    trackingActiveRef.current = false;
    timerRef.current?.cancel();
    timerRef.current = null;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    const watcher = watcherRef.current;
    watcherRef.current = null;
    watcher?.remove();
    if (startupTimerRef.current) clearTimeout(startupTimerRef.current);
    startupTimerRef.current = null;
    lastPointRef.current = null;
    activityWindow.current = null;
  }, [quest.id, setActiveQuestId, traceStartup]);

  const pauseForegroundTracking = useCallback(() => {
    sessionRef.current += 1;
    trackingActiveRef.current = false;
    timerRef.current?.cancel();
    timerRef.current = null;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    const watcher = watcherRef.current;
    watcherRef.current = null;
    watcher?.remove();
    if (startupTimerRef.current) clearTimeout(startupTimerRef.current);
    startupTimerRef.current = null;
    lastPointRef.current = null;
    activityWindow.current = null;
  }, []);

  const fail = useCallback((message: string, denied = false, result: Exclude<AttemptResult,'COMPLETED'> = 'FAILED', reason: AttemptReason = denied ? 'PERMISSION_DENIED' : 'TECHNICAL_ERROR') => {
    traceStartup('failed:' + startupPhaseRef.current);
    resumeStartupRef.current = false;
    endAttempt(result,reason);
    stopVerification();
    if (!isTimer) { backgroundSessionActiveRef.current = false; void stopQuestBackgroundTracking(quest.id).catch(() => undefined); }
    if (!focusedRef.current) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    playFeedback('ERROR');
    setError(message);
    transition(denied ? 'DENIED' : 'ERROR');
  }, [stopVerification, transition, endAttempt, isTimer, quest.id, traceStartup]);

  const checkCompletion = useCallback(async () => {
    stopVerification();
    const session = sessionRef.current;
    setError(null);
    transition('CHECKING');
    try {
      await awaitWithTimeout(flushAttempt());
      const access = await awaitWithTimeout(getQuestAccess(quest.id));
      const pendingHandoff = pendingHandoffRef.current;
      if (pendingHandoff) {
        await awaitWithTimeout(pendingHandoff);
        // Only release the handoff we actually awaited. A newer screen-lock
        // handoff may already own the slot and must finish before reattaching.
        if (pendingHandoffRef.current === pendingHandoff) pendingHandoffRef.current = null;
      }
      let checkpoint: QuestCheckpoint | null = null;
      let backgroundSession = null;
      if (access === 'AVAILABLE') {
        [checkpoint, backgroundSession] = await Promise.all([
          awaitWithTimeout(loadQuestCheckpoint(quest.id)),
          isTimer ? Promise.resolve(null) : awaitWithTimeout(loadBackgroundQuestSession()),
        ]);
      } else if (access === 'COMPLETED' || access === 'LOCKED') {
        backgroundSessionActiveRef.current = false;
        await awaitWithTimeout(clearQuestCheckpoint(quest.id));
        if (quest.verification.type !== 'TIMER') {
          await stopQuestBackgroundTracking(quest.id).catch(() => undefined);
        }
      }
      if (!focusedRef.current || session !== sessionRef.current) return;
      const ownsBackgroundSession = backgroundSession?.questId === quest.id;
      backgroundSessionActiveRef.current = ownsBackgroundSession;
      if (ownsBackgroundSession && backgroundSession) { attemptRef.current = backgroundSession.attemptId; setActiveQuestId(quest.id); }
      checkpointRef.current = checkpoint;
      activityBaseRef.current = checkpoint?.activityFeatures ?? null;
      distanceRef.current = checkpoint?.distanceMeters ?? 0;
      scoreRef.current = checkpoint?.verificationScore ?? 100;
      extendedRef.current = checkpoint?.extendedGoal ?? false;
      checkpointWriteRef.current = { distance: checkpoint?.distanceMeters ?? 0, at: Date.now() };
      setDistance(checkpoint?.distanceMeters ?? 0);
      setDuration(checkpoint?.durationSeconds ?? 0);
      setExtendedGoal(checkpoint?.extendedGoal ?? false);
      if (quest.activityType && checkpoint?.activityFeatures) {
        const restored = classifyActivity(quest.activityType, checkpoint.activityFeatures);
        activityRef.current = restored;
        setActivity(restored);
      } else {
        activityRef.current = null;
        setActivity(null);
      }
      setAlreadyCompleted(access === 'COMPLETED');
      transition(access === 'COMPLETED' ? 'COMPLETED' : access === 'LOCKED' ? 'LOCKED' : 'READY');
      if (access === 'COMPLETED') void refreshPlayer();
      // A screen lock may unmount this screen while the native location task
      // keeps the attempt alive. Reattach the foreground watcher automatically
      // instead of leaving the user at READY with a running background session.
      if (access === 'AVAILABLE' && ownsBackgroundSession && AppState.currentState === 'active' && !pendingHandoffRef.current) void startQuestRef.current();
    } catch {
      if (focusedRef.current && session === sessionRef.current) {
        // A transient SQLite timeout must not destroy a native GPS session.
        // Keep its ownership and let the next foreground check restore it.
        if (backgroundSessionActiveRef.current) {
          setError('Nie udało się chwilowo odczytać postępu. Misja GPS nadal działa w tle.');
          transition('STARTING');
        } else {
          setError('Nie można odczytać stanu misji z SQLite. Spróbuj ponownie.');
          transition('ERROR');
        }
      }
    }
  }, [stopVerification, transition, fail, refreshPlayer, quest.id, quest.activityType, quest.verification.type, flushAttempt, isTimer]);

  useFocusEffect(useCallback(() => {
    focusedRef.current = true;
    void checkCompletion();
    return () => {
      resumeStartupRef.current = false;
      if (['STARTING','TRACKING'].includes(statusRef.current)) {
        if (isTimer) {
          void persistCheckpoint(true).catch(() => undefined);
          endAttempt('INTERRUPTED','LEFT_SCREEN');
          stopVerification();
        } else if (backgroundSessionActiveRef.current) {
          const anchor = lastPointRef.current;
          // Queue the mode switch first so the background task begins
          // accounting locations immediately. Checkpoint persistence is independent.
          pendingHandoffRef.current = handoffQuestToBackground(quest.id, anchor)
            .then(() => persistCheckpoint(true))
            .catch(() => undefined);
          pauseForegroundTracking();
        } else {
          // Leaving during permissions/startup before a durable background
          // session exists must close the attempt instead of orphaning it.
          endAttempt('INTERRUPTED','LEFT_SCREEN');
          stopVerification();
        }
      } else if (statusRef.current === 'ERROR' && attemptRef.current) {
        // Completion may have timed out in UI while its SQLite transaction is
        // still queued. This interrupt is serialized behind it: a successful
        // atomic completion wins and makes endAttempt a no-op; a true failure
        // releases the open attempt so another mission can start.
        endAttempt('INTERRUPTED','LEFT_SCREEN');
        if (!isTimer) {
          backgroundSessionActiveRef.current = false;
          void stopQuestBackgroundTracking(quest.id).catch(() => undefined);
        }
        stopVerification();
      } else if (!(statusRef.current === 'READY' && backgroundSessionActiveRef.current)) {
        stopVerification();
      }
      focusedRef.current = false;
    };
  }, [checkCompletion, stopVerification, endAttempt, persistCheckpoint, pauseForegroundTracking, isTimer, quest.id]));

  useEffect(() => {
    if (!focusedRef.current || quest.category !== 'DAILY' || !quest.dayKey || !daily) return;
    if (!daily.clockAnomaly && daily.dayKey === quest.dayKey) return;
    if (['COMPLETING','COMPLETED'].includes(statusRef.current)) return;
    if (attemptRef.current) endAttempt('INTERRUPTED','DAY_ROLLOVER');
    backgroundSessionActiveRef.current = false;
    if (!isTimer) void stopQuestBackgroundTracking(quest.id).catch(() => undefined);
    void clearQuestCheckpoint(quest.id).catch(() => undefined);
    checkpointRef.current = null;
    activityBaseRef.current = null;
    stopVerification();
    setError(daily.clockAnomaly
      ? 'Daily jest wstrzymane do czasu sprawdzenia daty telefonu.'
      : 'Rozpoczął się nowy dzień SYSTEMU. Ta misja Daily wygasła.');
    transition('LOCKED');
  }, [daily?.dayKey, daily?.clockAnomaly, quest.category, quest.dayKey, quest.id, endAttempt, isTimer, stopVerification, transition]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      const previous = appStateRef.current;
      appStateRef.current = state;

      if (!isTimer && state === 'background' && backgroundSessionActiveRef.current &&
          ['STARTING','TRACKING'].includes(statusRef.current)) {
        const anchor = lastPointRef.current;
        resumeStartupRef.current = statusRef.current === 'STARTING';
        backgroundHandoffRef.current = true;
        pendingHandoffRef.current = handoffQuestToBackground(quest.id, anchor)
            .then(() => persistCheckpoint(true))
          .catch(() => undefined);
        pauseForegroundTracking();
        return;
      }

      if (!isTimer && previous !== 'active' && state === 'active' && backgroundHandoffRef.current) {
        backgroundHandoffRef.current = false;
        const resumeStartup = resumeStartupRef.current;
        resumeStartupRef.current = false;
        const checking = checkCompletion();
        const resumeSession = sessionRef.current;
        void checking.then(async () => {
          if (resumeStartup && resumeSession === sessionRef.current && focusedRef.current && AppState.currentState === 'active' &&
              statusRef.current === 'READY') await startQuestRef.current();
        });
      }
      // TIMER quests keep their monotonic timer alive while the process remains alive.
      // GPS quests are handed off to the native background location task.
    });
    return () => subscription.remove();
  }, [isTimer, persistCheckpoint, pauseForegroundTracking, checkCompletion, quest.id]);

  // Both verifiers enter the same completion pipeline; only their evidence differs.
  const finishQuest = useCallback(async (evidence: QuestEvidence) => {
    if (!focusedRef.current || statusRef.current !== 'TRACKING') return;
    evidence = { ...evidence, attemptId: attemptRef.current ?? undefined };
    transition('COMPLETING');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    stopVerification();
    const session = sessionRef.current;
    setDuration(evidence.durationSeconds);
    try {
      const result = await awaitWithTimeout(completeVerifiedQuest(evidence));
      await awaitWithTimeout(clearQuestCheckpoint(quest.id));
      if (!isTimer) {
        backgroundSessionActiveRef.current = false;
        await stopQuestBackgroundTracking(quest.id).catch(() => undefined);
      }
      checkpointRef.current = null;
      activityBaseRef.current = null;
      if (attemptRef.current === evidence.attemptId) attemptRef.current = null;
      if (!focusedRef.current || session !== sessionRef.current) return;
      setAlreadyCompleted(!result.awarded);
      setReceipt(result.receipt ?? null);
      setLoot(result.loot ?? null);
      transition('COMPLETED');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    } catch {
      if (focusedRef.current && session === sessionRef.current) {
        // A UI timeout does not cancel the serialized SQLite transaction.
        // Do not mark the attempt FAILED here: the commit may still succeed.
        // Retry first re-reads canonical completion and only starts again when
        // the quest is genuinely still AVAILABLE.
        if (!isTimer) {
          backgroundSessionActiveRef.current = false;
          void stopQuestBackgroundTracking(quest.id).catch(() => undefined);
        }
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
        playFeedback('ERROR');
        setError('Nie udało się potwierdzić zapisu nagrody. Sprawdź zapis ponownie — SYSTEM najpierw odczyta wynik transakcji.');
        transition('ERROR');
      }
    }
  }, [completeVerifiedQuest, stopVerification, transition, hasTimer, quest.id, isTimer]);

  useEffect(() => {
    if (status !== 'TRACKING') return;
    const session = sessionRef.current;
    const interval = setInterval(() => {
      if (!focusedRef.current || session !== sessionRef.current || statusRef.current !== 'TRACKING') return;
      if (!isTimer && appStateRef.current !== 'active') return;
      // A temporary GPS signal gap must not end an active mission.
      // Native background tracking continues until a usable fix returns.
      if (hasTimer) {
        const sample = timerRef.current?.sample();
        if (!sample) return;
        setDuration(sample.seconds);
        if (isTimer && !sample.verified) void persistCheckpoint().catch(() => undefined);
        const evidence = buildEvidence(quest, distanceRef.current, sample.seconds, scoreRef.current);
        if (evidence) void finishQuest(evidence);
      } else if (startTimeRef.current) setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    intervalRef.current = interval;
    return () => {
      clearInterval(interval);
      if (intervalRef.current === interval) intervalRef.current = null;
    };
  }, [status, fail, finishQuest, isTimer, hasTimer, quest]);

  function processLocation(location: Location.LocationObject, session: number) {
    if (!focusedRef.current || session !== sessionRef.current || !trackingActiveRef.current ||
        !['STARTING', 'TRACKING'].includes(statusRef.current)) return;
    // A cached/out-of-order fix is not evidence of clock manipulation.
    // Reject actual mock/future fixes, but ignore stale native delivery before
    // comparing it with the last accepted anchor.
    if (location.mocked !== true && Number.isFinite(location.timestamp) &&
        location.timestamp <= Date.now() + 1000 &&
        (Date.now() - location.timestamp > 15000 ||
          (lastPointRef.current && location.timestamp <= lastPointRef.current.timestamp))) return;
    const risk = inspectGpsRisk(lastPointRef.current, location);
    riskRef.current = mergeRiskSnapshots(riskRef.current, risk);
    setAntiCheatRisk(riskRef.current);
    if (riskRef.current.action === 'REJECT') {
      lastPointRef.current = null;
      fail('ANTI-CHEAT 2.0 zatrzymał pomiar: wykryto niewiarygodny sygnał GPS lub anomalię czasu.', false, 'SUSPICIOUS', 'VERIFICATION_REJECTED');
      return;
    }
    if (riskRef.current.action === 'REVIEW') scoreRef.current = Math.min(scoreRef.current, 60);
    else if (riskRef.current.action === 'DOWNGRADE') scoreRef.current = Math.min(scoreRef.current, 75);
    setAccuracy(location.coords.accuracy);
    if (quest.activityType && activityWindow.current) {
      const window = activityWindow.current;
      window.add(location);
      const mergedFeatures = mergeActivityFeatures(activityBaseRef.current, window.features());
      const result = classifyActivity(quest.activityType, mergedFeatures);
      activityRef.current = result;
      setActivity(result); setCurrentSpeed(window.currentSpeed());
      if (isUsableLocation(location)) lastFixTimeRef.current = Date.now();
      if (statusRef.current === 'STARTING' && isUsableLocation(location)) {
        if (startupTimerRef.current) clearTimeout(startupTimerRef.current);
        startupTimerRef.current = null; startTimeRef.current = Date.now(); trackingSince.current = performance.now();
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); playFeedback('QUEST_START'); transition('TRACKING');
      }
      distanceRef.current = result.features.distanceMeters;
      setDistance(distanceRef.current); setDuration(Math.floor(result.features.durationSeconds));
      void persistCheckpoint().catch(() => undefined);
      if (quest.verification.type !== 'TIMER' && distanceRef.current >= quest.verification.minimumDistanceMeters * (extendedRef.current ? 1.25 : 1)) {
        if (result.verdict !== 'VERIFIED') {
          if (quest.category === 'DAILY') void awaitWithTimeout(recordActivityAttempt(quest.id, result)).then(() => refreshPlayer()).catch(() => undefined);
          void clearQuestCheckpoint(quest.id).catch(() => undefined);
          checkpointRef.current = null;
          activityBaseRef.current = null;
          fail((result.verdict === 'SUSPICIOUS' ? 'AKTYWNOŚĆ WYMAGA PONOWNEJ WERYFIKACJI — ' : 'MISJA NIEZALICZONA — ') + verdictMessage(result), false, result.verdict, result.verdict === 'REJECTED' ? 'VERIFICATION_REJECTED' : 'LOW_CONFIDENCE'); return; }
        void finishQuest({ questId: quest.id, verificationType: 'GPS_DISTANCE', distanceMeters: distanceRef.current,
          durationSeconds: result.features.durationSeconds, verificationScore: result.verificationScore, activity: result });
      }
      return;
    }
    if (!isUsableLocation(location)) {
      // Temporary poor accuracy is not a new start. Retain the last good
      // anchor; verifiedSegment will reject any gap longer than 15 seconds.
      return;
    }
    const previous = lastPointRef.current;
    if (previous && location.timestamp <= previous.timestamp) return;
    lastFixTimeRef.current = Date.now();
    if (statusRef.current === 'STARTING') {
      if (startupTimerRef.current) clearTimeout(startupTimerRef.current);
      startupTimerRef.current = null;
      startTimeRef.current = Date.now();
      if (hasTimer) timerRef.current = createFocusTimer(targetSeconds, undefined, checkpointRef.current?.durationSeconds ?? 0);
      trackingSince.current = performance.now();
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); playFeedback('QUEST_START');
      transition('TRACKING');
    }
    if (!previous) {
      lastPointRef.current = location;
      return;
    }
    const segment = verifiedSegment(previous, location);
    if (segment <= 0) {
      const seconds = (location.timestamp - previous.timestamp) / 1000;
      const meters = distanceBetween(previous, location);
      if (seconds > 15 || meters > 100 || meters / seconds > 8.5) {
        lastPointRef.current = location;
      }
      // Keep the anchor for small movements so normal walking can accumulate
      // enough displacement to exceed GPS uncertainty without counting jitter.
      return;
    }
    lastPointRef.current = location;
    scoreRef.current = Math.min(scoreRef.current,
      verificationScoreForAccuracy(previous.coords.accuracy),
      verificationScoreForAccuracy(location.coords.accuracy));
    distanceRef.current += segment;
    setDistance(distanceRef.current);
    void persistCheckpoint().catch(() => undefined);
    const seconds = hasTimer ? timerRef.current?.sample().seconds ?? 0
      : Math.max(1, Math.floor((Date.now() - startTimeRef.current!) / 1000));
    const evidence = buildEvidence(quest, distanceRef.current, seconds, scoreRef.current);
    if (evidence) void finishQuest(evidence);
  }

  async function startQuest() {
    // Synchronous ref guard: a second tap is blocked even before React renders.
    traceStartup('start-request');
    if (!focusedRef.current || !ready || statusRef.current !== 'READY') { traceStartup('start-ignored'); return; }
    resumeStartupRef.current = false;
    transition('STARTING');
    setError(null);
    stopVerification();
    setActiveQuestId(quest.id);
    const session = sessionRef.current;
    const active = () => focusedRef.current && session === sessionRef.current;
    const checkpoint = checkpointRef.current;
    distanceRef.current = checkpoint?.distanceMeters ?? 0;
    scoreRef.current = checkpoint?.verificationScore ?? 100;
    riskRef.current = EMPTY_GPS_RISK;
    setAntiCheatRisk(EMPTY_GPS_RISK);
    startTimeRef.current = null; trackingSince.current = null;
    activityBaseRef.current = checkpoint?.activityFeatures ?? null;
    activityWindow.current = quest.activityType ? createActivityWindow() : null;
    if (quest.activityType && checkpoint?.activityFeatures) {
      const restored = classifyActivity(quest.activityType, checkpoint.activityFeatures);
      activityRef.current = restored;
      setActivity(restored);
    } else {
      activityRef.current = null;
      setActivity(null);
    }
    setCurrentSpeed(0);
    setDistance(distanceRef.current);
    setDuration(checkpoint?.durationSeconds ?? 0);
    setAccuracy(null);
    try {
      traceStartup('access');
      const access = await getQuestAccess(quest.id);
      if (!active()) return;
      if (access === 'LOCKED') {
        stopVerification();
        transition('LOCKED');
        return;
      }
      if (access === 'COMPLETED') {
        stopVerification();
        setAlreadyCompleted(true);
        transition('COMPLETED');
        void refreshPlayer();
        return;
      }
      if (!active()) return;
      if (!isTimer) {
        const backgroundOwner = await loadBackgroundQuestSession();
        if (!active()) return;
        if (backgroundOwner && backgroundOwner.questId !== quest.id) {
          fail('Inna misja ruchowa jest już aktywna w tle. Wróć do niej i zakończ albo przerwij pomiar przed uruchomieniem kolejnej.');
          return;
        }
      }
      // Recover the native session's durable attempt even if this screen was
      // remounted before checkCompletion restored its React refs.
      const nativeSession = !isTimer ? await loadBackgroundQuestSession() : null;
      if (!active()) return;
      const existingAttemptId = nativeSession?.questId === quest.id
        ? nativeSession.attemptId : attemptRef.current;
      const attemptId = existingAttemptId ?? `attempt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      attemptRef.current = attemptId;
      if (!existingAttemptId) await beginQuestAttempt(quest.id, attemptId);
      if (!active()) {
        if (!existingAttemptId) void endQuestAttempt(attemptId,'ABANDONED','PROCESS_ENDED').catch(() => undefined);
        return;
      }
      if (isTimer) {
        if (appStateRef.current !== 'active' || AppState.currentState !== 'active') {
          fail('Uruchom protokół skupienia na pierwszym planie.');
          return;
        }
        if (startupTimerRef.current) clearTimeout(startupTimerRef.current);
        startupTimerRef.current = null;
        timerRef.current = createFocusTimer(targetSeconds, undefined, checkpointRef.current?.durationSeconds ?? 0);
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        playFeedback('QUEST_START');
        trackingSince.current = performance.now();
        transition('TRACKING');
        return;
      }
      traceStartup('disclosure');
      const disclosureAccepted = await confirmBackgroundLocationDisclosure();
      if (!active()) return;
      if (!disclosureAccepted) {
        fail('Lokalizacja w tle nie została włączona. Misja ruchowa nie została rozpoczęta.', true);
        return;
      }
      traceStartup('foreground-permission');
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!active()) return;
      if (permission.status !== 'granted') {
        fail('SYSTEM nie może zweryfikować tej misji bez dostępu do lokalizacji.', true);
        return;
      }
      traceStartup('background-permission');
      const backgroundGranted = await requestBackgroundLocationAccess();
      if (!active()) return;
      if (!backgroundGranted) {
        fail('Aby misja liczyła dystans przy wygaszonym ekranie, zezwól SYSTEMOWI na lokalizację „zawsze” / w tle.', true);
        return;
      }
      traceStartup('background-session');
      await prepareQuestBackgroundTracking({
        questId: quest.id,
        attemptId,
        extendedGoal: extendedRef.current,
      });
      backgroundSessionActiveRef.current = true;
      // Keep the native task in BACKGROUND mode while the foreground watcher
      // is still being created. Otherwise positions arriving during the
      // permission/subscription gap are silently discarded.
      if (!active()) return;
      if (appStateRef.current !== 'active' || AppState.currentState !== 'active') {
        resumeStartupRef.current = (statusRef.current as string) === 'STARTING';
        backgroundHandoffRef.current = true;
        pendingHandoffRef.current = handoffQuestToBackground(quest.id, lastPointRef.current)
            .then(() => persistCheckpoint(true))
          .catch(() => undefined);
        pauseForegroundTracking();
        return;
      }
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!active()) return;
      if (!servicesEnabled) {
        fail('Lokalizacja jest wyłączona. Włącz GPS w ustawieniach telefonu.');
        return;
      }
      // The watch supplies the first fix too, so there is no uncancellable
      // getCurrentPositionAsync request left running after leaving this screen.
      let firstLocation: Location.LocationObject | null = null;
      traceStartup('foreground-watcher');
      const watcher = await Location.watchPositionAsync(
        // MULTI still needs fresh fixes while waiting for time after reaching 600 m.
        { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1500, distanceInterval: hasTimer || quest.activityType ? 0 : 2 },
        location => {
          if (!active()) return;
          // Native callbacks may arrive before the promise returns its handle.
          if (!trackingActiveRef.current) firstLocation = location;
          else { try { processLocation(location, session); } catch { fail('Nie udało się przeanalizować pomiaru. Rozpocznij nową próbę.'); } }
        },
        () => { if (active()) fail('Wystąpił błąd GPS. Pomiar został zatrzymany.'); }
      );
      if (!active()) {
        watcher.remove();
        return;
      }
      if (appStateRef.current !== 'active' || AppState.currentState !== 'active') {
        watcher.remove();
        resumeStartupRef.current = (statusRef.current as string) === 'STARTING';
        backgroundHandoffRef.current = true;
        pendingHandoffRef.current = handoffQuestToBackground(quest.id, lastPointRef.current)
            .then(() => persistCheckpoint(true))
          .catch(() => undefined);
        pauseForegroundTracking();
        return;
      }
      watcherRef.current = watcher;
      trackingActiveRef.current = true;
      try {
        await markQuestForeground(quest.id);
      } catch {
        // A background completion can remove the session while the watch
        // subscribes. Re-read canonical completion rather than fail the quest.
        watcher.remove();
        watcherRef.current = null;
        trackingActiveRef.current = false;
        if (active()) void checkCompletion();
        return;
      }
      if (!active()) return;
      // The app may have been locked while markQuestForeground awaited SQLite.
      // Restore native ownership immediately; never leave the task in
      // FOREGROUND mode with no foreground watcher.
      if (appStateRef.current !== 'active' || AppState.currentState !== 'active') {
        backgroundHandoffRef.current = true;
        pendingHandoffRef.current = handoffQuestToBackground(quest.id, lastPointRef.current)
          .then(() => persistCheckpoint(true))
          .catch(() => undefined);
        pauseForegroundTracking();
        return;
      }
      // The first usable GPS fix may take longer than 30 seconds. Keep the
      // durable native session alive rather than treating acquisition as failure.
      if (firstLocation) processLocation(firstLocation, session);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    } catch {
      if (active()) fail('Nie udało się uruchomić misji. Sprawdź dostęp do GPS i bazy danych, a następnie spróbuj ponownie.');
    }
  }

  startQuestRef.current = startQuest;

  async function retryQuest() {
    if (!focusedRef.current || !['ERROR', 'DENIED'].includes(statusRef.current)) return;
    // Recheck an ambiguous SQLite result before starting a fresh GPS session.
    await checkCompletion();
    if (focusedRef.current && statusRef.current === 'READY') await startQuest();
  }

  return {
    status, error, distance, accuracy, duration, alreadyCompleted, receipt, loot, activity, currentSpeed, extendedGoal, chooseExtendedGoal, antiCheatRisk,
    ready, databaseError, refreshPlayer, startQuest, retryQuest,
  };
}
