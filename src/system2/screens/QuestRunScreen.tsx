import { awaitWithTimeout } from '../storage/awaitWithTimeout';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { SYSTEM_COLORS } from '../core';
import { FIRST_MOVEMENT_QUEST } from '../quests/firstMovement';
import { distanceBetween, isUsableLocation, verifiedSegment, verificationScoreForAccuracy } from '../verification/gps';
import { isQuestCompleted } from '../storage/database';
import { useSystem } from '../state/SystemProvider';

type RunStatus = 'CHECKING' | 'READY' | 'STARTING' | 'TRACKING' | 'COMPLETING' | 'COMPLETED' | 'DENIED' | 'ERROR';
const TARGET_DISTANCE = FIRST_MOVEMENT_QUEST.verification.minimumDistanceMeters!;

export default function QuestRunScreen() {
  const router = useRouter();
  const { completeVerifiedQuest, ready, error: databaseError, refreshPlayer } = useSystem();
  const [status, setStatus] = useState<RunStatus>('CHECKING');
  const [error, setError] = useState<string | null>(null);
  const [distance, setDistance] = useState(0);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [duration, setDuration] = useState(0);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const watcherRef = useRef<Location.LocationSubscription | null>(null);
  const lastPointRef = useRef<Location.LocationObject | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const lastFixTimeRef = useRef(0);
  const distanceRef = useRef(0);
  const scoreRef = useRef(100);
  const sessionRef = useRef(0);
  const focusedRef = useRef(false);
  const statusRef = useRef<RunStatus>('CHECKING');
  const startupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const transition = useCallback((next: RunStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const stopGps = useCallback(() => {
    // Also invalidates pending permissions / a watch promise without a handle yet.
    sessionRef.current += 1;
    const watcher = watcherRef.current;
    watcherRef.current = null;
    watcher?.remove();
    if (startupTimerRef.current) clearTimeout(startupTimerRef.current);
    startupTimerRef.current = null;
    lastPointRef.current = null;
  }, []);

  const fail = useCallback((message: string, denied = false) => {
    stopGps();
    if (!focusedRef.current) return;
    setError(message);
    transition(denied ? 'DENIED' : 'ERROR');
  }, [stopGps, transition]);

  const checkCompletion = useCallback(async () => {
    stopGps();
    const session = sessionRef.current;
    setError(null);
    transition('CHECKING');
    try {
      const completed = await awaitWithTimeout(isQuestCompleted(FIRST_MOVEMENT_QUEST.id));
      if (!focusedRef.current || session !== sessionRef.current) return;
      setAlreadyCompleted(completed);
      transition(completed ? 'COMPLETED' : 'READY');
      if (completed) void refreshPlayer();
    } catch {
      if (focusedRef.current && session === sessionRef.current) {
        fail('Nie można odczytać stanu misji z SQLite. Spróbuj ponownie.');
      }
    }
  }, [stopGps, transition, fail, refreshPlayer]);

  useFocusEffect(useCallback(() => {
    focusedRef.current = true;
    void checkCompletion();
    return () => {
      focusedRef.current = false;
      stopGps();
    };
  }, [checkCompletion, stopGps]));

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'background' &&
          (statusRef.current === 'TRACKING' || statusRef.current === 'STARTING')) {
        fail('Pomiar przerwany po przejściu do tła. Rozpocznij ponownie i pozostaw ekran misji otwarty.');
      }
    });
    return () => subscription.remove();
  }, [fail]);

  useEffect(() => {
    if (status !== 'TRACKING') return;
    const interval = setInterval(() => {
      if (!focusedRef.current || statusRef.current !== 'TRACKING') return;
      if (Date.now() - lastFixTimeRef.current > 30000) {
        fail('Utracono wiarygodny sygnał GPS. Wyjdź na otwartą przestrzeń i rozpocznij ponownie.');
        return;
      }
      if (startTimeRef.current) setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [status, fail]);

  async function finishQuest(finalDistance: number) {
    if (statusRef.current !== 'TRACKING' || finalDistance < TARGET_DISTANCE) return;
    transition('COMPLETING');
    stopGps();
    const session = sessionRef.current;
    const durationSeconds = Math.max(1, Math.floor((Date.now() - startTimeRef.current!) / 1000));
    setDuration(durationSeconds);
    try {
      const result = await awaitWithTimeout(completeVerifiedQuest({
        questId: FIRST_MOVEMENT_QUEST.id, verificationType: 'GPS_DISTANCE',
        verificationScore: scoreRef.current, distanceMeters: finalDistance, durationSeconds,
      }));
      if (!focusedRef.current || session !== sessionRef.current) return;
      setAlreadyCompleted(!result.awarded);
      transition('COMPLETED');
      // Haptics cannot turn a committed quest into a failed quest.
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    } catch {
      if (focusedRef.current && session === sessionRef.current) {
        fail('Nie udało się potwierdzić zapisu nagrody. Sprawdź zapis ponownie. Jeśli misja nie została zapisana, rozpocznij nowy pomiar.');
      }
    }
  }

  function processLocation(location: Location.LocationObject, session: number) {
    if (!focusedRef.current || session !== sessionRef.current ||
        !['STARTING', 'TRACKING'].includes(statusRef.current)) return;
    setAccuracy(location.coords.accuracy);
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
    if (distanceRef.current >= TARGET_DISTANCE) void finishQuest(distanceRef.current);
  }

  async function startQuest() {
    // Synchronous ref guard: a second tap is blocked even before React renders.
    if (!focusedRef.current || !ready || statusRef.current !== 'READY') return;
    transition('STARTING');
    setError(null);
    stopGps();
    const session = sessionRef.current;
    const active = () => focusedRef.current && session === sessionRef.current;
    distanceRef.current = 0;
    scoreRef.current = 100;
    startTimeRef.current = null;
    setDistance(0);
    setDuration(0);
    setAccuracy(null);
    startupTimerRef.current = setTimeout(() => {
      if (active()) fail('Nie uzyskano dokładnej lokalizacji w ciągu 30 sekund. Sprawdź GPS i spróbuj ponownie.');
    }, 30000);
    try {
      if (await isQuestCompleted(FIRST_MOVEMENT_QUEST.id)) {
        if (!active()) return;
        stopGps();
        setAlreadyCompleted(true);
        transition('COMPLETED');
        void refreshPlayer();
        return;
      }
      if (!active()) return;
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!active()) return;
      if (permission.status !== 'granted') {
        fail('SYSTEM nie może zweryfikować tej misji bez dostępu do lokalizacji.', true);
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
      const watcher = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1500, distanceInterval: 2 },
        location => processLocation(location, session),
        () => { if (active()) fail('Wystąpił błąd GPS. Pomiar został zatrzymany.'); }
      );
      if (!active()) {
        watcher.remove();
        return;
      }
      watcherRef.current = watcher;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    } catch {
      if (active()) fail('Nie udało się uruchomić misji. Sprawdź dostęp do GPS i bazy danych, a następnie spróbuj ponownie.');
    }
  }

  const progress =
    Math.min(
      100,
      (distance /
        TARGET_DISTANCE) *
        100
    );

  const metersLeft =
    Math.max(
      0,
      TARGET_DISTANCE -
        Math.round(distance)
    );

  const minutes =
    Math.floor(duration / 60);

  const seconds =
    duration % 60;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={
          styles.content
        }
      >
        <View style={styles.topBar}>
          <Pressable
            onPress={() =>
              router.back()
            }
            style={styles.backButton}
          >
            <Text
              style={styles.backText}
            >
              ‹
            </Text>
          </Pressable>

          <View>
            <Text
              style={styles.systemLabel}
            >
              SYSTEM // QUEST
            </Text>

            <Text
              style={styles.screenTitle}
            >
              LIVE CONTRACT
            </Text>
          </View>
        </View>

        <View
          style={styles.questCard}
        >
          <View
            style={styles.questHeader}
          >
            <Text
              style={styles.category}
            >
              GPS QUEST
            </Text>

            <Text
              style={styles.difficulty}
            >
              EASY
            </Text>
          </View>

          <Text
            style={styles.questTitle}
          >
            PIERWSZY RUCH
          </Text>

          <Text
            style={
              styles.description
            }
          >
            Przejdź 500 metrów.
            SYSTEM obserwuje rzeczywisty
            dystans przez GPS. Nie ma
            ręcznego przycisku ukończenia.
          </Text>

          <View
            style={styles.targetRow}
          >
            <View>
              <Text
                style={
                  styles.metricLabel
                }
              >
                TARGET
              </Text>

              <Text
                style={
                  styles.metricBig
                }
              >
                500 M
              </Text>
            </View>

            <View>
              <Text
                style={
                  styles.metricLabel
                }
              >
                SKILL
              </Text>

              <Text
                style={
                  styles.metricCyan
                }
              >
                VIT
              </Text>
            </View>

            <View>
              <Text
                style={
                  styles.metricLabel
                }
              >
                VERIFY
              </Text>

              <Text
                style={
                  styles.metricCyan
                }
              >
                GPS
              </Text>
            </View>
          </View>
        </View>

        <View
          style={styles.tracker}
        >
          <Text
            style={styles.trackerLabel}
          >
            LIVE DISTANCE
          </Text>

          <View
            style={styles.distanceRow}
          >
            <Text
              style={
                styles.distanceNumber
              }
            >
              {Math.round(distance)}
            </Text>

            <Text
              style={
                styles.distanceUnit
              }
            >
              M
            </Text>
          </View>

          <View
            style={styles.progressTrack}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.max(
                    1,
                    progress
                  )}%`,
                },
              ]}
            />
          </View>

          <View
            style={styles.liveStats}
          >
            <View
              style={styles.liveStat}
            >
              <Text
                style={
                  styles.liveValue
                }
              >
                {metersLeft}
              </Text>

              <Text
                style={
                  styles.liveLabel
                }
              >
                M LEFT
              </Text>
            </View>

            <View
              style={styles.liveStat}
            >
              <Text
                style={
                  styles.liveValue
                }
              >
                {minutes}:
                {String(
                  seconds
                ).padStart(
                  2,
                  '0'
                )}
              </Text>

              <Text
                style={
                  styles.liveLabel
                }
              >
                TIME
              </Text>
            </View>

            <View
              style={styles.liveStat}
            >
              <Text
                style={
                  styles.liveValue
                }
              >
                {accuracy === null
                  ? '--'
                  : Math.round(
                      accuracy
                    )}
              </Text>

              <Text
                style={
                  styles.liveLabel
                }
              >
                GPS ±M
              </Text>
            </View>
          </View>

          {(status === 'CHECKING' || status === 'STARTING') && (
            <View style={styles.trackingBox}>
              <Text style={styles.trackingText}>
                {status === 'CHECKING' ? 'SPRAWDZANIE ZAPISU...' : 'OCZEKIWANIE NA GPS...'}
              </Text>
            </View>
          )}

          {!ready && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{databaseError ?? 'Trwa odczyt profilu SYSTEMU...'}</Text>
              {databaseError && <Pressable onPress={() => { void refreshPlayer(); }}>
                <Text style={styles.retry}>PONÓW ODCZYT PROFILU</Text>
              </Pressable>}
            </View>
          )}

          {status === 'READY' && ready && (
            <Pressable
              style={
                styles.startButton
              }
              onPress={
                startQuest
              }
            >
              <Text
                style={
                  styles.startButtonText
                }
              >
                ROZPOCZNIJ QUEST
              </Text>

              <Text
                style={
                  styles.startArrow
                }
              >
                →
              </Text>
            </Pressable>
          )}

          {status ===
            'TRACKING' && (
            <View
              style={
                styles.trackingBox
              }
            >
              <View
                style={
                  styles.liveDot
                }
              />

              <Text
                style={
                  styles.trackingText
                }
              >
                SYSTEM MONITORUJE RUCH
              </Text>
            </View>
          )}

          {status ===
            'COMPLETING' && (
            <View
              style={
                styles.trackingBox
              }
            >
              <Text
                style={
                  styles.trackingText
                }
              >
                WERYFIKACJA...
              </Text>
            </View>
          )}

          {(status === 'DENIED' || status === 'ERROR') && (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>
                {status === 'DENIED' ? 'BRAK DOSTĘPU DO GPS' : 'MISJA ZATRZYMANA'}
              </Text>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={() => { void checkCompletion(); }}>
                <Text style={styles.retry}>SPRAWDŹ ZAPIS I SPRÓBUJ PONOWNIE</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View
          style={styles.rewardCard}
        >
          <Text
            style={styles.rewardTitle}
          >
            VERIFIED REWARD
          </Text>

          <View
            style={styles.rewardRow}
          >
            <Text
              style={styles.reward}
            >
              +100 REAL XP
            </Text>

            <Text
              style={styles.reward}
            >
              +80 VIT XP
            </Text>

            <Text
              style={styles.reward}
            >
              +10 ENERGY
            </Text>
          </View>
        </View>

        {status ===
          'COMPLETED' && (
          <View
            style={
              styles.completeCard
            }
          >
            <Text
              style={
                styles.completeSmall
              }
            >
              QUEST COMPLETE
            </Text>

            <Text
              style={
                styles.completeTitle
              }
            >
              VERIFIED
            </Text>

            <Text
              style={
                styles.completeText
              }
            >
              {alreadyCompleted
                ? 'Ta misja została już wcześniej zaliczona. Nagrody nie mogą zostać odebrane drugi raz.'
                : 'Ruch został potwierdzony. Nagrody zostały zapisane w profilu SYSTEMU.'}
            </Text>

            <Pressable
              style={
                styles.returnButton
              }
              onPress={() =>
                router.back()
              }
            >
              <Text
                style={
                  styles.returnText
                }
              >
                WRÓĆ DO SYSTEMU
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles =
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor:
        SYSTEM_COLORS.background,
    },

    content: {
      paddingTop: 60,
      paddingHorizontal: 22,
      paddingBottom: 80,
    },

    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      marginBottom: 30,
    },

    backButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 1,
      borderColor:
        SYSTEM_COLORS.line,
      alignItems: 'center',
      justifyContent: 'center',
    },

    backText: {
      color:
        SYSTEM_COLORS.cyan,
      fontSize: 35,
      lineHeight: 38,
    },

    systemLabel: {
      color:
        SYSTEM_COLORS.cyan,
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 3,
    },

    screenTitle: {
      color:
        SYSTEM_COLORS.white,
      fontSize: 26,
      fontWeight: '900',
      marginTop: 4,
    },

    questCard: {
      borderWidth: 1,
      borderColor:
        SYSTEM_COLORS.line,
      borderRadius: 26,
      backgroundColor:
        '#061115',
      padding: 22,
    },

    questHeader: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
    },

    category: {
      color:
        SYSTEM_COLORS.cyan,
      fontWeight: '900',
      fontSize: 11,
      letterSpacing: 2,
    },

    difficulty: {
      color:
        SYSTEM_COLORS.textMuted,
      fontWeight: '900',
      fontSize: 9,
      letterSpacing: 2,
    },

    questTitle: {
      color:
        SYSTEM_COLORS.white,
      fontSize: 30,
      lineHeight: 34,
      fontWeight: '900',
      marginTop: 22,
    },

    description: {
      color:
        SYSTEM_COLORS.textMuted,
      fontSize: 14,
      lineHeight: 22,
      marginTop: 14,
    },

    targetRow: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      marginTop: 28,
    },

    metricLabel: {
      color:
        SYSTEM_COLORS.textVeryMuted,
      fontSize: 8,
      fontWeight: '900',
      letterSpacing: 2,
      marginBottom: 7,
    },

    metricBig: {
      color:
        SYSTEM_COLORS.white,
      fontSize: 20,
      fontWeight: '900',
    },

    metricCyan: {
      color:
        SYSTEM_COLORS.cyan,
      fontSize: 20,
      fontWeight: '900',
    },

    tracker: {
      marginTop: 16,
      borderWidth: 1,
      borderColor:
        SYSTEM_COLORS.line,
      borderRadius: 26,
      backgroundColor:
        '#041014',
      padding: 22,
    },

    trackerLabel: {
      color:
        SYSTEM_COLORS.textMuted,
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 3,
    },

    distanceRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'center',
      marginTop: 24,
    },

    distanceNumber: {
      color:
        SYSTEM_COLORS.white,
      fontSize: 82,
      lineHeight: 88,
      fontWeight: '900',
    },

    distanceUnit: {
      color:
        SYSTEM_COLORS.cyan,
      fontSize: 24,
      fontWeight: '900',
      marginBottom: 13,
      marginLeft: 7,
    },

    progressTrack: {
      height: 8,
      backgroundColor:
        '#09272E',
      borderRadius: 999,
      overflow: 'hidden',
      marginTop: 14,
    },

    progressFill: {
      height: '100%',
      backgroundColor:
        SYSTEM_COLORS.cyan,
      borderRadius: 999,
    },

    liveStats: {
      flexDirection: 'row',
      marginTop: 26,
    },

    liveStat: {
      flex: 1,
      alignItems: 'center',
    },

    liveValue: {
      color:
        SYSTEM_COLORS.white,
      fontSize: 19,
      fontWeight: '900',
    },

    liveLabel: {
      color:
        SYSTEM_COLORS.textVeryMuted,
      fontSize: 8,
      fontWeight: '900',
      letterSpacing: 1.4,
      marginTop: 6,
    },

    startButton: {
      marginTop: 28,
      height: 72,
      borderRadius: 19,
      backgroundColor:
        SYSTEM_COLORS.cyan,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      paddingHorizontal: 24,
    },

    startButtonText: {
      color: '#001014',
      fontSize: 15,
      fontWeight: '900',
      letterSpacing: 2,
    },

    startArrow: {
      color: '#001014',
      fontSize: 33,
    },

    trackingBox: {
      marginTop: 28,
      minHeight: 68,
      borderRadius: 18,
      borderWidth: 1,
      borderColor:
        SYSTEM_COLORS.lineBright,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },

    liveDot: {
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor:
        SYSTEM_COLORS.success,
    },

    trackingText: {
      color:
        SYSTEM_COLORS.cyan,
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 2,
    },

    errorBox: {
      marginTop: 28,
      borderRadius: 18,
      borderWidth: 1,
      borderColor:
        SYSTEM_COLORS.danger,
      padding: 18,
    },

    errorTitle: {
      color:
        SYSTEM_COLORS.danger,
      fontWeight: '900',
      fontSize: 13,
    },

    errorText: {
      color:
        SYSTEM_COLORS.textMuted,
      marginTop: 8,
      lineHeight: 20,
    },

    retry: {
      color:
        SYSTEM_COLORS.white,
      fontWeight: '900',
      marginTop: 18,
    },

    rewardCard: {
      marginTop: 16,
      borderWidth: 1,
      borderColor:
        SYSTEM_COLORS.line,
      borderRadius: 22,
      padding: 20,
      backgroundColor:
        '#061115',
    },

    rewardTitle: {
      color:
        SYSTEM_COLORS.textMuted,
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 3,
    },

    rewardRow: {
      gap: 9,
      marginTop: 16,
    },

    reward: {
      color:
        SYSTEM_COLORS.cyan,
      fontSize: 14,
      fontWeight: '900',
    },

    completeCard: {
      marginTop: 18,
      borderRadius: 26,
      borderWidth: 1,
      borderColor:
        SYSTEM_COLORS.success,
      backgroundColor:
        '#061512',
      padding: 25,
      alignItems: 'center',
    },

    completeSmall: {
      color:
        SYSTEM_COLORS.success,
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 4,
    },

    completeTitle: {
      color:
        SYSTEM_COLORS.white,
      fontSize: 39,
      fontWeight: '900',
      marginTop: 10,
    },

    completeText: {
      color:
        SYSTEM_COLORS.textMuted,
      textAlign: 'center',
      lineHeight: 21,
      marginTop: 10,
    },

    returnButton: {
      width: '100%',
      height: 62,
      borderRadius: 17,
      backgroundColor:
        SYSTEM_COLORS.success,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 23,
    },

    returnText: {
      color: '#00120D',
      fontWeight: '900',
      letterSpacing: 2,
    },
  });