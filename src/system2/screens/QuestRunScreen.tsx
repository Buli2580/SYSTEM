import {
    useEffect,
    useRef,
    useState,
} from 'react';

import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { useRouter } from 'expo-router';

import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';

import {
    SYSTEM_COLORS,
} from '../core';

import {
    FIRST_MOVEMENT_QUEST,
} from '../quests/firstMovement';

import {
    distanceBetween,
    verificationScoreForAccuracy,
} from '../verification/gps';

import {
    isQuestCompleted,
} from '../storage/database';

import {
    useSystem,
} from '../state/SystemProvider';

type RunStatus =
  | 'READY'
  | 'TRACKING'
  | 'COMPLETING'
  | 'COMPLETED'
  | 'DENIED';

const TARGET_DISTANCE = 500;

export default function QuestRunScreen() {
  const router = useRouter();

  const {
    completeVerifiedQuest,
  } = useSystem();

  const [status, setStatus] =
    useState<RunStatus>('READY');

  const [distance, setDistance] =
    useState(0);

  const [accuracy, setAccuracy] =
    useState<number | null>(null);

  const [duration, setDuration] =
    useState(0);

  const [alreadyCompleted, setAlreadyCompleted] =
    useState(false);

  const watcherRef =
    useRef<Location.LocationSubscription | null>(
      null
    );

  const lastPointRef =
    useRef<Location.LocationObject | null>(null);

  const startTimeRef =
    useRef<number | null>(null);

  const distanceRef =
    useRef(0);

  const accuracyRef =
    useRef<number | null>(null);

  const completingRef =
    useRef(false);

  useEffect(() => {
    isQuestCompleted(
      FIRST_MOVEMENT_QUEST.id
    ).then((completed) => {
      if (completed) {
        setAlreadyCompleted(true);
        setStatus('COMPLETED');
      }
    });

    return () => {
      watcherRef.current?.remove();
      watcherRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (status !== 'TRACKING') {
      return;
    }

    const interval = setInterval(() => {
      if (!startTimeRef.current) return;

      setDuration(
        Math.floor(
          (Date.now() -
            startTimeRef.current) /
            1000
        )
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  async function finishQuest(
    finalDistance: number
  ) {
    if (completingRef.current) return;

    completingRef.current = true;

    setStatus('COMPLETING');

    watcherRef.current?.remove();
    watcherRef.current = null;

    const durationSeconds =
      startTimeRef.current
        ? Math.max(
            1,
            Math.floor(
              (Date.now() -
                startTimeRef.current) /
                1000
            )
          )
        : 1;

    const verificationScore =
      verificationScoreForAccuracy(
        accuracyRef.current
      );

    const result =
      await completeVerifiedQuest({
        questId:
          FIRST_MOVEMENT_QUEST.id,

        realXp:
          FIRST_MOVEMENT_QUEST.rewards
            .realXp,

        skillXp:
          FIRST_MOVEMENT_QUEST.rewards
            .skillXp ?? {},

        gameEnergy:
          FIRST_MOVEMENT_QUEST.rewards
            .gameEnergy ?? 0,

        verificationType:
          'GPS_DISTANCE',

        verificationScore,

        distanceMeters:
          Math.round(finalDistance),

        durationSeconds,
      });

    await Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    );

    setAlreadyCompleted(
      !result.awarded
    );

    setStatus('COMPLETED');
  }

  async function processLocation(
    location: Location.LocationObject
  ) {
    const currentAccuracy =
      location.coords.accuracy;

    accuracyRef.current =
      currentAccuracy;

    setAccuracy(currentAccuracy);

    if (
      currentAccuracy !== null &&
      currentAccuracy > 50
    ) {
      return;
    }

    const previous =
      lastPointRef.current;

    if (!previous) {
      lastPointRef.current =
        location;

      return;
    }

    const segment =
      distanceBetween(
        previous,
        location
      );

    const deltaSeconds =
      Math.max(
        0.1,
        (location.timestamp -
          previous.timestamp) /
          1000
      );

    const calculatedSpeed =
      segment / deltaSeconds;

    // Odrzucamy drobne drgania GPS.
    if (segment < 1.5) {
      return;
    }

    // Odrzucamy teleporty GPS.
    if (
      segment > 100 ||
      calculatedSpeed > 8.5
    ) {
      lastPointRef.current =
        location;

      return;
    }

    lastPointRef.current =
      location;

    const nextDistance =
      distanceRef.current + segment;

    distanceRef.current =
      nextDistance;

    setDistance(nextDistance);

    if (
      nextDistance >=
      TARGET_DISTANCE
    ) {
      await finishQuest(
        nextDistance
      );
    }
  }

  async function startQuest() {
    const permission =
      await Location.requestForegroundPermissionsAsync();

    if (
      permission.status !==
      'granted'
    ) {
      setStatus('DENIED');

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error
      );

      return;
    }

    distanceRef.current = 0;
    setDistance(0);

    completingRef.current = false;

    startTimeRef.current =
      Date.now();

    const firstLocation =
      await Location.getCurrentPositionAsync({
        accuracy:
          Location.Accuracy.Highest,
      });

    lastPointRef.current =
      firstLocation;

    accuracyRef.current =
      firstLocation.coords.accuracy;

    setAccuracy(
      firstLocation.coords.accuracy
    );

    setStatus('TRACKING');

    await Haptics.impactAsync(
      Haptics.ImpactFeedbackStyle.Medium
    );

    watcherRef.current =
      await Location.watchPositionAsync(
        {
          accuracy:
            Location.Accuracy.BestForNavigation,

          timeInterval: 1500,

          distanceInterval: 2,
        },

        (location) => {
          processLocation(location);
        }
      );
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

          {status ===
            'READY' && (
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

          {status ===
            'DENIED' && (
            <View
              style={styles.errorBox}
            >
              <Text
                style={
                  styles.errorTitle
                }
              >
                BRAK DOSTĘPU DO GPS
              </Text>

              <Text
                style={
                  styles.errorText
                }
              >
                SYSTEM nie może
                zweryfikować tej misji bez
                lokalizacji.
              </Text>

              <Pressable
                onPress={
                  startQuest
                }
              >
                <Text
                  style={
                    styles.retry
                  }
                >
                  SPRÓBUJ PONOWNIE
                </Text>
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