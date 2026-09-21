import { useSystem } from '../state/SystemProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RewardSummary from '../components/RewardSummary';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useEffect, useRef, useState } from 'react';
import { SYSTEM_COLORS } from '../core';
import { FIRST_MOVEMENT_QUEST } from '../quests/firstMovement';
import type { RunnableQuest } from '../quests/types';
import { useQuestRun } from '../quests/useQuestRun';
import MultiProgress, { formatQuestTime } from '../components/MultiProgress';
import { AWAKENING_QUESTS } from '../quests/catalog';
import { getNextAction } from '../quests/nextAction';
import { MissionBriefing } from '../components/QuestExperience';
import SystemAmbientBackground from '../components/SystemAmbientBackground';
import { PresentationEventPresets, presentationEventBus } from '../presentation/PresentationEvents';

export default function QuestRunScreen({ quest = FIRST_MOVEMENT_QUEST }: { quest?: RunnableQuest } = {}) {
  const router = useRouter();
  const system = useSystem();
  const { story } = system;
  const rematch = story?.rematchQuestIds.includes(quest.id) ?? false;
  const insets = useSafeAreaInsets();
  const { status, error, distance, accuracy, duration, alreadyCompleted, receipt, activity, currentSpeed, extendedGoal, chooseExtendedGoal,
    ready, databaseError, refreshPlayer, startQuest, retryQuest } = useQuestRun(quest);
  const [questAccepted, setQuestAccepted] = useState(false);
  const [startInProgress, setStartInProgress] = useState(false);
  const [questCompleteVisible, setQuestCompleteVisible] = useState(false);
  const startInProgressRef = useRef(false);
  const presentationFailureRef = useRef(false);
  const isTimer = quest.verification.type === 'TIMER';
  const isMulti = quest.verification.type === 'MULTI';
  const target = quest.verification.type === 'TIMER'
    ? quest.verification.minimumDurationSeconds : quest.verification.minimumDistanceMeters * (extendedGoal ? 1.25 : 1);
  const formatTime = formatQuestTime;
  const progress = target > 0 && Number.isFinite(target)
    ? Math.min(100, Math.max(0, (isTimer ? duration : distance) / target * 100))
    : 0;

  const metersLeft =
    Math.max(
      0,
      target -
        Math.round(isTimer ? duration : distance)
    );

  const minutes =
    Math.floor(duration / 60);

  const seconds =
    duration % 60;
  const showLiveTracker = isLiveQuestStatus(status);
  const renderStatus: string = status;
  const nextAction = getNextAction({
    ...system,
    player: system.player,
    completedQuestIds: system.completedQuestIds,
    failedQuestIds: system.failedQuestIds,
    activeQuestId: status === 'COMPLETED' ? null : system.activeQuestId,
    awakeningCompleted: system.awakeningCompleted,
    daily: system.daily,
    story: system.story,
    achievements: system.achievementState,
  });
  const continueSystem = () => {
    if (nextAction.route === '/quest' && nextAction.questId) {
      router.replace({ pathname: '/quest', params: { questId: nextAction.questId } });
      return;
    }
    router.replace(nextAction.route);
  };

  useEffect(() => {
    if (!questAccepted) return;
    const timer = setTimeout(() => setQuestAccepted(false), 1200);
    return () => clearTimeout(timer);
  }, [questAccepted]);

  useEffect(() => {
    setQuestCompleteVisible(status === 'COMPLETED');

    if ((status === 'DENIED' || status === 'ERROR') && !presentationFailureRef.current) {
      presentationFailureRef.current = true;
      presentationEventBus.emit(PresentationEventPresets.questFailed(quest.id, error || 'Quest verification failed.'));
    }

  }, [error, quest.category, quest.id, quest.title, receipt, status]);

  const handleStartQuest = () => {
    if (startInProgressRef.current) return;
    startInProgressRef.current = true;
    setStartInProgress(true);
    setQuestAccepted(true);
    presentationFailureRef.current = false;
    presentationEventBus.emit(PresentationEventPresets.questAccepted(quest.id, quest.title));
    return startQuest()
      .then(() => {
        presentationEventBus.emit(PresentationEventPresets.questStarted(quest.id, quest.title));
        if (quest.category === 'BOSS') {
          presentationEventBus.emit(PresentationEventPresets.bossAppeared(quest.id, quest.title));
        }
      })
      .catch(cause => {
        if (!presentationFailureRef.current) {
          presentationFailureRef.current = true;
          presentationEventBus.emit(PresentationEventPresets.questFailed(
            quest.id,
            cause instanceof Error ? cause.message : 'Quest start failed.',
          ));
        }
      })
      .finally(() => {
        startInProgressRef.current = false;
        setStartInProgress(false);
      });
  };

  return (
    <View style={styles.root}>
      <SystemAmbientBackground intensity="quiet" />
      <ScrollView
        contentContainerStyle={
          [styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]
        }
      >
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button"
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
              SYSTEM // MISJA
            </Text>

            <Text
              style={styles.screenTitle}
            >
              {quest.category === 'BOSS' ? 'PROTOKÓŁ BOSSA' : quest.category === 'DAILY' ? 'PROTOKÓŁ DZIENNY' : `PRZEBUDZENIE ${quest.order}/${AWAKENING_QUESTS.length}`}
            </Text>
          </View>
        </View>

        <MissionBriefing
          quest={quest}
          status={status}
          onStart={status === 'READY' && ready ? handleStartQuest : undefined}
          startDisabled={startInProgress || !ready}
          resume={distance > 0 || duration > 0}
        />

        {!!quest.activityType && <View style={styles.questCard}>
          <Text style={styles.category}>ZGODNOŚĆ AKTYWNOŚCI // {!activity || activity.features.durationSeconds < 30 ? 'SPRAWDZANIE' : activity.verdict === 'VERIFIED' ? 'DOBRA' : 'NISKA WIARYGODNOŚĆ'}</Text>
          <Text style={styles.description}>TERAZ {((currentSpeed ?? 0) * 3.6).toFixed(1)} KM/H · ŚREDNIO {((activity?.features.averageSpeedMps ?? 0) * 3.6).toFixed(1)} KM/H</Text>
          <Text style={styles.description}>GPS {accuracy === null ? '—' : `±${Math.round(accuracy)} M`} · KROKI — · KADENCJA —</Text>
          <Text style={styles.description}>TYLKO GPS // STANDARD · maksymalna pewność 87/100</Text>
        </View>}
        {showLiveTracker && <View style={styles.tracker}>
          <Text
            style={styles.trackerLabel}
          >
            {isTimer ? 'SKUPIENIE // POZOSTAŁY CZAS' : 'DYSTANS NA ŻYWO'}
          </Text>

          <View
            style={styles.distanceRow}
          >
            <Text adjustsFontSizeToFit numberOfLines={1}
              style={
                styles.distanceNumber
              }
            >
              {isTimer ? formatTime(metersLeft) : Math.round(distance)}
            </Text>

            <Text
              style={
                styles.distanceUnit
              }
            >
              {isTimer ? '' : 'M'}
            </Text>
          </View>

          <View accessibilityRole="progressbar" accessibilityLabel="Mission progress" accessibilityValue={{ min: 0, max: 100, now: Math.round(progress) }} style={styles.progressTrack}>
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
                {isTimer ? formatTime(metersLeft) : metersLeft}
              </Text>

              <Text
                style={
                  styles.liveLabel
                }
              >
                {isTimer ? 'POZOSTAŁY CZAS' : 'M DO CELU'}
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
                CZAS
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
                {isTimer ? (renderStatus === 'TRACKING' ? 'ON' : '--') : accuracy === null ? '--' : Math.round(accuracy)}
              </Text>

              <Text
                style={
                  styles.liveLabel
                }
              >
                {isTimer ? 'SKUPIENIE' : 'GPS ±M'}
              </Text>
            </View>
          </View>

          {renderStatus ===
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
                {isTimer ? `${quest.title} // AKTYWNA` : isMulti ? 'OSTATNIA PRÓBA // AKTYWNA' : 'SYSTEM MONITORUJE AKTYWNOŚĆ · TŁO WŁ.'}
              </Text>
            </View>
          )}

          {renderStatus ===
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
                SYSTEM // WERYFIKACJA…
              </Text>
            </View>
          )}

        </View>}

        {(renderStatus === 'CHECKING' || renderStatus === 'STARTING') && (
          <View style={styles.trackingBox}>
            <Text style={styles.trackingText}>
              {renderStatus === 'CHECKING' ? 'SPRAWDZANIE ZAPISU...' : isTimer ? 'URUCHAMIANIE TIMERA...' : 'OCZEKIWANIE NA GPS...'}
            </Text>
          </View>
        )}

        {renderStatus === 'LOCKED' && <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>QUEST LOCKED</Text>
          <Text style={styles.errorText}>{quest.category === 'DAILY' ? 'Ta misja nie należy do dostępnego zestawu Daily. Sprawdź datę telefonu i odśwież listę questów.' : 'Ukończ poprzednie misje Awakening, aby rozpocząć tę próbę.'}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Przejdź do questów" onPress={() => router.replace('/quests')}><Text style={styles.retry}>PRZEJDŹ DO QUESTÓW</Text></Pressable>
        </View>}

        {!ready && <View style={styles.errorBox}>
          <Text style={styles.errorText}>{databaseError ?? 'Trwa odczyt profilu SYSTEMU...'}</Text>
          {databaseError && <Pressable accessibilityRole="button" accessibilityLabel="Ponów odczyt profilu" onPress={() => { void refreshPlayer(); }}>
            <Text style={styles.retry}>PONÓW ODCZYT PROFILU</Text>
          </Pressable>}
        </View>}

        {renderStatus === 'READY' && distance > 0 && !isTimer && <View style={styles.trackingBox}><Text style={styles.trackingText}>ZAPISANY POSTĘP · {Math.floor(distance)} M</Text><Text style={styles.description}>Wznów zapisaną próbę. Aktywna misja ruchowa może mierzyć dystans w tle przy wymaganych uprawnieniach.</Text></View>}
        {renderStatus === 'READY' && quest.category === 'DAILY' && !!quest.activityType && <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: extendedGoal }} onPress={() => chooseExtendedGoal(!extendedGoal)} style={styles.optionButton}>
          <Text style={styles.retry}>{extendedGoal ? '✓ ' : ''}CEL ROZSZERZONY 125%</Text>
          <Text style={styles.description}>Wybór przed startem. Automatyczne ukończenie nastąpi po dłuższym dystansie.</Text>
        </Pressable>}
        {rematch && <Text style={styles.retry}>SYSTEM MESSAGE // REMATCH AVAILABLE</Text>}

        {(renderStatus === 'DENIED' || renderStatus === 'ERROR') && <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>{renderStatus === 'DENIED' ? 'BRAK DOSTĘPU DO GPS' : 'ATTEMPT ENDED // SYSTEM ANALYSIS'}</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Spróbuj ponownie" onPress={() => { void retryQuest(); }}>
            <Text style={styles.retry}>{rematch ? 'BEGIN REMATCH' : 'SPRÓBUJ PONOWNIE'}</Text>
          </Pressable>
        </View>}

        {quest.verification.type === 'MULTI' && showLiveTracker && <MultiProgress
          distance={distance} duration={duration} meters={quest.verification.minimumDistanceMeters}
          seconds={quest.verification.minimumDurationSeconds} />}

        {receipt && <RewardSummary receipt={receipt} />}
        {renderStatus ===
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
              MISJA UKOŃCZONA
            </Text>

            <Text
              style={
                styles.completeTitle
              }
            >
              POTWIERDZONA
            </Text>

            <Text
              style={
                styles.completeText
              }
            >
              {alreadyCompleted
                ? 'Ta misja została już wcześniej zaliczona. Nagrody nie mogą zostać odebrane drugi raz.'
                : 'Cel został zweryfikowany. Nagrody zostały zapisane w profilu SYSTEMU.'}
            </Text>

            <Pressable accessibilityRole="button"
              style={
                styles.returnButton
              }
              onPress={alreadyCompleted ? () => router.back() : continueSystem}
            >
              <Text
                style={
                  styles.returnText
                }
              >
                {alreadyCompleted ? 'WRÓĆ DO SYSTEMU' : nextAction.title}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {questAccepted && (
        <Animated.View pointerEvents="none" entering={FadeIn.duration(220)} exiting={FadeOut.duration(220)} style={styles.questOverlay}>
          <Text style={styles.questOverlayLabel}>QUEST ACCEPTED</Text>
          <Text style={styles.questOverlayTitle}>{quest.title}</Text>
        </Animated.View>
      )}

      {questCompleteVisible && (
        <Animated.View pointerEvents="none" entering={FadeIn.duration(250)} exiting={FadeOut.duration(220)} style={styles.questCompleteOverlay}>
          <Text style={styles.questOverlayLabel}>QUEST COMPLETE</Text>
          <Text style={styles.questOverlayTitle}>VERIFIED</Text>
        </Animated.View>
      )}
    </View>
  );
}

function isLiveQuestStatus(status: string) {
  return status === 'TRACKING' || status === 'COMPLETING' || status === 'COMPLETED';
}

const styles =
  StyleSheet.create({
    root: {
      flex: 1,
      position: 'relative',
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

    description: {
      color:
        SYSTEM_COLORS.textMuted,
      fontSize: 14,
      lineHeight: 22,
      marginTop: 14,
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
      transform: [{ scale: 1 }],
    },

    startButtonPressed: {
      transform: [{ scale: 0.985 }],
      opacity: 0.96,
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

    optionButton: {
      marginTop: 18,
      paddingVertical: 4,
    },

    questOverlay: {
      position: 'absolute',
      inset: 0,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(2, 9, 15, 0.72)',
      paddingHorizontal: 26,
    },

    questCompleteOverlay: {
      position: 'absolute',
      inset: 0,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(3, 18, 16, 0.8)',
      paddingHorizontal: 26,
    },

    questOverlayLabel: {
      color: SYSTEM_COLORS.cyan,
      fontSize: 11,
      fontWeight: '900',
      letterSpacing: 4,
      textAlign: 'center',
    },

    questOverlayTitle: {
      color: SYSTEM_COLORS.white,
      fontSize: 36,
      fontWeight: '900',
      textAlign: 'center',
      marginTop: 10,
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
