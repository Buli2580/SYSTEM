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
import * as Location from 'expo-location';
import type { RunnableQuest, QuestEvidence } from './types';
import { createFocusTimer } from '../verification/timer';
import { distanceBetween, isUsableLocation, verifiedSegment, verificationScoreForAccuracy } from '../verification/gps';
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
  const { completeVerifiedQuest, ready, error: databaseError, refreshPlayer, setActiveQuestId } = useSystem();
  const [status, setStatus] = useState<RunStatus>('CHECKING');
  const [error, setError] = useState<string | null>(null);
  const [distance, setDistance] = useState(0);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [duration, setDuration] = useState(0);
  const [receipt, setReceipt] = useState<RewardReceipt | null>(null);
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
  const backgroundHandoffRef = useRef(false);

  const activityWindow = useRef<ReturnType<typeof createActivityWindow> | null>(null);
  const activityBaseRef = useRef<ActivityFeatures | null>(null);
  const activityRef = useRef<ActivityEvidence | null>(null);
  const checkpointRef = useRef<QuestCheckpoint | null>(null);
  const checkpointWriteRef = useRef({ distance: 0, at: 0 });
  const [activity, setActivity] = useState<ActivityEvidence | null>(null);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [extendedGoal, setExtendedGoal] = useState(false);
  const extendedRef = useRef(false);
  const [photoProof, setPhotoProof] = useState(false);
  const photoProofRef = useRef(false);
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
    if (quest.verification.type === 'TIMER' || distanceRef.current <= 0) return;
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
  }, [quest.id, quest.verification.type]);
  const chooseExtendedGoal = (value:boolean) => {
    if (statusRef.current !== 'READY' || quest.category !== 'DAILY' || !quest.activityType) return;
    extendedRef.current = value; setExtendedGoal(value);
  };

  const transition = useCallback((next: RunStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const stopVerification = useCallback(() => {
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
  }, [quest.id, setActiveQuestId]);

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
    endAttempt(result,reason);
    stopVerification();
    if (!isTimer) void stopQuestBackgroundTracking(quest.id).catch(() => undefined);
    if (!focusedRef.current) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setError(message);
    transition(denied ? 'DENIED' : 'ERROR');
  }, [stopVerification, transition, endAttempt, isTimer, quest.id]);

  const checkCompletion = useCallback(async () => {
    stopVerification();
    const session = sessionRef.current;
    setError(null);
    transition('CHECKING');
    try {
      await awaitWithTimeout(flushAttempt());
      const access = await awaitWithTimeout(getQuestAccess(quest.id));
      let checkpoint: QuestCheckpoint | null = null;
      let backgroundSession = null;
      if (access === 'AVAILABLE' && quest.verification.type !== 'TIMER') {
        [checkpoint, backgroundSession] = await Promise.all([
          awaitWithTimeout(loadQuestCheckpoint(quest.id)),
          awaitWithTimeout(loadBackgroundQuestSession()),
        ]);
      } else if (access === 'COMPLETED' || access === 'LOCKED') {
        await awaitWithTimeout(clearQuestCheckpoint(quest.id));
        if (quest.verification.type !== 'TIMER') {
          await stopQuestBackgroundTracking(quest.id).catch(() => undefined);
        }
      }
      if (!focusedRef.current || session !== sessionRef.current) return;
      if (backgroundSession?.questId === quest.id) attemptRef.current = backgroundSession.attemptId;
      checkpointRef.current = checkpoint;
      activityBaseRef.current = checkpoint?.activityFeatures ?? null;
      distanceRef.current = checkpoint?.distanceMeters ?? 0;
      scoreRef.current = checkpoint?.verificationScore ?? 100;
      extendedRef.current = checkpoint?.extendedGoal ?? false;
      checkpointWriteRef.current = { distance: checkpoint?.distanceMeters ?? 0, at: Date.now() };
      setDistance(checkpoint?.distanceMeters ?? 0);
      setDuration(checkpoint?.durationSeconds ?? 0);
      setExtendedGoal(checkpoint?.extendedGoal ?? false);
      photoProofRef.current = false;
      setPhotoProof(false);
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
    } catch {
      if (focusedRef.current && session === sessionRef.current) {
        fail('Nie można odczytać stanu misji z SQLite. Spróbuj ponownie.');
      }
    }
  }, [stopVerification, transition, fail, refreshPlayer, quest.id, quest.activityType, quest.verification.type, flushAttempt, isTimer]);

  useFocusEffect(useCallback(() => {
    focusedRef.current = true;
    void checkCompletion();
    return () => {
      if (['STARTING','TRACKING'].includes(statusRef.current)) {
        if (isTimer) {
          endAttempt('INTERRUPTED','LEFT_SCREEN');
          stopVerification();
        } else {
          const anchor = lastPointRef.current;
          void persistCheckpoint(true)
            .then(() => handoffQuestToBackground(quest.id, anchor))
            .catch(() => undefined);
          pauseForegroundTracking();
        }
      } else {
        stopVerification();
      }
      focusedRef.current = false;
    };
  }, [checkCompletion, stopVerification, endAttempt, persistCheckpoint, pauseForegroundTracking, isTimer, quest.id]));

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      const previous = appStateRef.current;
      appStateRef.current = state;

      if (!isTimer && state === 'background' && trackingActiveRef.current === true &&
          ['STARTING','TRACKING'].includes(statusRef.current)) {
        const anchor = lastPointRef.current;
        backgroundHandoffRef.current = true;
        void persistCheckpoint(true)
          .then(() => handoffQuestToBackground(quest.id, anchor))
          .catch(() => undefined);
        pauseForegroundTracking();
        return;
      }

      if (!isTimer && previous !== 'active' && state === 'active' && backgroundHandoffRef.current) {
        backgroundHandoffRef.current = false;
        void checkCompletion();
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
    stopVerification();
    const session = sessionRef.current;
    setDuration(evidence.durationSeconds);
    try {
      const result = await awaitWithTimeout(completeVerifiedQuest(evidence));
      await awaitWithTimeout(clearQuestCheckpoint(quest.id));
      if (!isTimer) await stopQuestBackgroundTracking(quest.id).catch(() => undefined);
      checkpointRef.current = null;
      activityBaseRef.current = null;
      if (attemptRef.current === evidence.attemptId) attemptRef.current = null;
      if (!focusedRef.current || session !== sessionRef.current) return;
      setAlreadyCompleted(!result.awarded);
      setReceipt(result.receipt ?? null);
      transition('COMPLETED');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    } catch {
      if (focusedRef.current && session === sessionRef.current) {
        fail('Nie udało się potwierdzić zapisu nagrody. Sprawdź zapis ponownie. Jeśli misja nie została zapisana, rozpocznij nową próbę.');
      }
    }
  }, [completeVerifiedQuest, fail, stopVerification, transition, hasTimer, quest.id, isTimer]);

  useEffect(() => {
    if (status !== 'TRACKING') return;
    const session = sessionRef.current;
    const interval = setInterval(() => {
      if (!focusedRef.current || session !== sessionRef.current || statusRef.current !== 'TRACKING') return;
      if (!isTimer && appStateRef.current !== 'active') return;
      if (!isTimer && Date.now() - lastFixTimeRef.current > 30000) {
        fail('Utracono wiarygodny sygnał GPS. Wyjdź na otwartą przestrzeń i rozpocznij ponownie.');
        return;
      }
      if (hasTimer) {
        const sample = timerRef.current?.sample();
        if (!sample) return;
        setDuration(sample.seconds);
        const evidence = buildEvidence(quest, distanceRef.current, sample.seconds, scoreRef.current, photoProofRef.current);
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
        startupTimerRef.current = null; startTimeRef.current = Date.now(); trackingSince.current = performance.now(); transition('TRACKING');
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
        if (!quest.proofMode || photoProofRef.current) void finishQuest({ questId: quest.id, verificationType: 'GPS_DISTANCE', distanceMeters: distanceRef.current,
          durationSeconds: result.features.durationSeconds, verificationScore: result.verificationScore, activity: result,
          ...(quest.proofMode ? { photoCaptured: true } : {}) });
      }
      return;
    }
    if (!isUsableLocation(location)) {
      lastPointRef.current = null;
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
    const evidence = buildEvidence(quest, distanceRef.current, seconds, scoreRef.current, photoProofRef.current);
    if (evidence) void finishQuest(evidence);
  }

  async function startQuest() {
    // Synchronous ref guard: a second tap is blocked even before React renders.
    if (!focusedRef.current || !ready || statusRef.current !== 'READY') return;
    transition('STARTING');
    setError(null);
    stopVerification();
    setActiveQuestId(quest.id);
    const session = sessionRef.current;
    const active = () => focusedRef.current && session === sessionRef.current;
    const checkpoint = quest.verification.type === 'TIMER' ? null : checkpointRef.current;
    distanceRef.current = checkpoint?.distanceMeters ?? 0;
    scoreRef.current = checkpoint?.verificationScore ?? 100;
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
    photoProofRef.current = false;
    setPhotoProof(false);
    setDistance(distanceRef.current);
    setDuration(0);
    setAccuracy(null);
    startupTimerRef.current = setTimeout(() => {
      if (active()) fail(isTimer ? 'Nie udało się rozpocząć timera. Spróbuj ponownie.' : 'Nie uzyskano dokładnej lokalizacji w ciągu 30 sekund. Sprawdź GPS i spróbuj ponownie.');
    }, 30000);
    try {
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
      const existingAttemptId = attemptRef.current;
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
        trackingSince.current = performance.now();
      transition('TRACKING');
        return;
      }
      const disclosureAccepted = await confirmBackgroundLocationDisclosure();
      if (!active()) return;
      if (!disclosureAccepted) {
        fail('Lokalizacja w tle nie została włączona. Misja ruchowa nie została rozpoczęta.', true);
        return;
      }
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!active()) return;
      if (permission.status !== 'granted') {
        fail('SYSTEM nie może zweryfikować tej misji bez dostępu do lokalizacji.', true);
        return;
      }
      const backgroundGranted = await requestBackgroundLocationAccess();
      if (!active()) return;
      if (!backgroundGranted) {
        fail('Aby misja liczyła dystans przy wygaszonym ekranie, zezwól SYSTEMOWI na lokalizację „zawsze” / w tle.', true);
        return;
      }
      await prepareQuestBackgroundTracking({
        questId: quest.id,
        attemptId,
        extendedGoal: extendedRef.current,
      });
      await markQuestForeground(quest.id);
      if (!active()) return;
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!active()) return;
      if (!servicesEnabled) {
        fail('Lokalizacja jest wyłączona. Włącz GPS w ustawieniach telefonu.');
        return;
      }
      // The watch supplies the first fix too, so there is no uncancellable
      // getCurrentPositionAsync request left running after leaving this screen.
      let firstLocation: Location.LocationObject | null = null;
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
      watcherRef.current = watcher;
      trackingActiveRef.current = true;
      if (firstLocation) processLocation(firstLocation, session);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    } catch {
      if (active()) fail('Nie udało się uruchomić misji. Sprawdź dostęp do GPS i bazy danych, a następnie spróbuj ponownie.');
    }
  }

  async function retryQuest() {
    if (!focusedRef.current || !['ERROR', 'DENIED'].includes(statusRef.current)) return;
    // Recheck an ambiguous SQLite result before starting a fresh GPS session.
    await checkCompletion();
    if (focusedRef.current && statusRef.current === 'READY') await startQuest();
  }

  async function markPhotoProof() {
    if (!quest.proofMode || statusRef.current !== 'TRACKING') return;
    photoProofRef.current = true;
    setPhotoProof(true);
    const seconds = Math.max(
      1,
      activityRef.current?.features.durationSeconds ??
        timerRef.current?.sample().seconds ??
        (startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : duration),
    );
    const score = activityRef.current?.verificationScore ?? scoreRef.current;
    const evidence = buildEvidence(quest, distanceRef.current, seconds, score, true);
    if (!evidence) return;
    if (activityRef.current) evidence.activity = activityRef.current;
    await finishQuest(evidence);
  }

  return {
    status, error, distance, accuracy, duration, alreadyCompleted, receipt, activity, currentSpeed, extendedGoal, chooseExtendedGoal,
    photoProof, markPhotoProof,
    ready, databaseError, refreshPlayer, startQuest, retryQuest,
  };
}
