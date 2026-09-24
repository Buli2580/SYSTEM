import { useSystem } from '../state/SystemProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RewardSummary from '../components/RewardSummary';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInUp, FadeOut } from 'react-native-reanimated';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SYSTEM_COLORS } from '../core';
import { FIRST_MOVEMENT_QUEST } from '../quests/firstMovement';
import type { RunnableQuest } from '../quests/types';
import { useQuestRun } from '../quests/useQuestRun';
import MultiProgress, { formatQuestTime } from '../components/MultiProgress';
import { AWAKENING_QUESTS } from '../quests/catalog';
import { getNextAction } from '../quests/nextAction';
import { MissionBriefing, QuestFlowRail, QuestRecoveryPanel } from '../components/QuestExperience';
import SystemAmbientBackground from '../components/SystemAmbientBackground';
import AudioEnableAction from '../components/AudioEnableAction';
import {playAudioTheme,playFeedback,stopAudioTheme} from '../identity/audio';
import {applyCinematicPreset,stopCinematicAudio,triggerCinematicEvent} from '../audio/engine';
import {calculateAge} from '../identity/age';
import {capturePrivateQuestPhoto,removePrivateQuestPhoto,purgeStalePrivateQuestPhotos} from '../quests/privatePhoto';
import {queueTelemetry} from '../telemetry/amplitude';

export default function QuestRunScreen({ quest = FIRST_MOVEMENT_QUEST }: { quest?: RunnableQuest } = {}) {
  const router = useRouter();
  const system = useSystem();
  const { story } = system;
  const rematch = story?.rematchQuestIds.includes(quest.id) ?? false;
  const insets = useSafeAreaInsets();
  const { status, error, distance, accuracy, duration, alreadyCompleted, receipt, activity, currentSpeed, extendedGoal, chooseExtendedGoal, antiCheatRisk,
    ready, databaseError, refreshPlayer, startQuest, retryQuest } = useQuestRun(quest);
  const [questAccepted, setQuestAccepted] = useState(false);
  const [startInProgress, setStartInProgress] = useState(false);
  const startInProgressRef = useRef(false);
  const scrollRef = useRef<ScrollView | null>(null);
  const adultAge = calculateAge(system.player.birthDate);
  const adultPhotoEnabled = adultAge !== null && adultAge >= 18;
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);
  const [localPhotoBusy, setLocalPhotoBusy] = useState(false);
  const [localPhotoError, setLocalPhotoError] = useState<string | null>(null);
  const photoUriRef = useRef<string | null>(null);
  const photoActiveRef = useRef(false);
  const photoBusyRef = useRef(false);
  const questStatusRef = useRef(status);
  const telemetryStatusRef = useRef<string | null>(null);
  questStatusRef.current = status;

  useFocusEffect(useCallback(() => {
    photoActiveRef.current = true;
    try { purgeStalePrivateQuestPhotos(); } catch { /* Cache deletion retries next visit. */ }
    setLocalPhotoUri(null);
    setLocalPhotoError(null);
    return () => {
      photoActiveRef.current = false;
      const uri = photoUriRef.current;
      photoUriRef.current = null;
      if (uri) { try { removePrivateQuestPhoto(uri); } catch { /* OS cache may be temporarily unavailable. */ } }
    };
  }, []));

  const takePrivatePhoto = async () => {
    if (!adultPhotoEnabled || questStatusRef.current !== 'TRACKING' || photoBusyRef.current) return;
    photoBusyRef.current = true;
    setLocalPhotoBusy(true);
    setLocalPhotoError(null);
    try {
      const uri = await capturePrivateQuestPhoto();
      if (!uri) return;
      if (!photoActiveRef.current || questStatusRef.current !== 'TRACKING') {
        removePrivateQuestPhoto(uri);
        return;
      }
      const previous = photoUriRef.current;
      photoUriRef.current = uri;
      setLocalPhotoUri(uri);
      if (previous) removePrivateQuestPhoto(previous);
    } catch (cause) {
      if (photoActiveRef.current) {
        setLocalPhotoError(cause instanceof Error ? cause.message : 'Nie udało się wykonać lokalnego zdjęcia.');
      }
    } finally {
      photoBusyRef.current = false;
      if (photoActiveRef.current) setLocalPhotoBusy(false);
    }
  };

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
  const showBriefing = status === 'CHECKING' || status === 'READY' || status === 'STARTING';
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

  useEffect(()=>{
    if(telemetryStatusRef.current===status)return;
    telemetryStatusRef.current=status;
    const props={questId:quest.id,category:quest.category,difficulty:quest.difficulty};
    if(status==='READY')void queueTelemetry({event_type:'QUEST_BRIEFING_VIEW',event_properties:props});
    else if(status==='TRACKING')void queueTelemetry({event_type:'QUEST_START',event_properties:props});
    else if(status==='COMPLETING')void queueTelemetry({event_type:'VERIFY_START',event_properties:props});
    else if(status==='COMPLETED'){
      void queueTelemetry({event_type:'VERIFY_SUCCESS',event_properties:props});
      void queueTelemetry({event_type:'QUEST_COMPLETE',event_properties:props});
    }else if(status==='ERROR'||status==='DENIED')void queueTelemetry({event_type:'VERIFY_FAIL',event_properties:{...props,status}});
  },[status,quest.id,quest.category,quest.difficulty]);

  useEffect(() => {
    if (!questAccepted) return;
    const timer = setTimeout(() => setQuestAccepted(false), 1200);
    return () => clearTimeout(timer);
  }, [questAccepted]);

  useEffect(() => {
    if (!['COMPLETED','ERROR','DENIED'].includes(status)) return;
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 180);
    return () => clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    if (quest.category === 'BOSS') {
      playAudioTheme('BOSS');
      applyCinematicPreset('BOSS');
      triggerCinematicEvent('OGRE_ROAR');
    } else if (status === 'TRACKING') {
      applyCinematicPreset('CITY');
      triggerCinematicEvent('BASS_IMPACT');
      playAudioTheme('ACTIVE_QUEST');
    } else if (status === 'COMPLETED') {
      stopCinematicAudio();
      triggerCinematicEvent('AWAKENING_ENTER');
      stopAudioTheme();
      playAudioTheme('VICTORY');
      playFeedback('QUEST_COMPLETE');
    } else if (status === 'COMPLETING') {
      applyCinematicPreset('RUINS');
      triggerCinematicEvent('DEBRIS');
      playAudioTheme('QUEST');
      playFeedback('VERIFY');
    } else if (status === 'ERROR' || status === 'DENIED') {
      stopAudioTheme();
      playFeedback('ERROR');
    } else {
      playAudioTheme('QUEST');
    }
    return () => {stopCinematicAudio();stopAudioTheme()};
  }, [status, quest.category]);

  const handleStartQuest = () => {
    if (startInProgressRef.current) return;
    startInProgressRef.current = true;
    setStartInProgress(true);
    setQuestAccepted(true);
    return startQuest()
      .catch(() => undefined)
      .finally(() => {
        startInProgressRef.current = false;
        setStartInProgress(false);
      });
  };

  return (
    <View style={styles.root}>
      <SystemAmbientBackground
        intensity={quest.category === 'BOSS' ? 'world' : status === 'COMPLETING' || status === 'COMPLETED' ? 'hero' : status === 'TRACKING' ? 'default' : 'quiet'}
        screen={quest.category === 'BOSS' ? 'BOSS' : 'QUESTS'}
        scene={quest.category === 'BOSS' ? 'BOSS_ZONE' : status === 'TRACKING' ? 'CITY' : status === 'COMPLETED' ? 'PORTAL' : 'RUINS'}
        threat={quest.category === 'BOSS' ? 3 : status === 'TRACKING' || status === 'COMPLETING' ? 2 : 1}
        level={system.player.realLevel}
      />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={
          [styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]
        }
      >
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button"
            onPress={() => router.replace('/quests')}
            style={styles.backButton}
          >
            <Text
              style={styles.backText}
            >
              ‹
            </Text>
          </Pressable>

          <View style={styles.topTitle}>
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

        <AudioEnableAction cue={status==='TRACKING'?'ACTIVE_QUEST':quest.category==='BOSS'?'BOSS':'QUEST'}/>
        <QuestFlowRail status={status} />
        {showBriefing && <MissionBriefing
          quest={quest}
          status={status}
          onStart={status === 'READY' && ready ? handleStartQuest : undefined}
          startDisabled={startInProgress || !ready}
          resume={distance > 0 || duration > 0}
        />}
        {(status === 'TRACKING' || status === 'COMPLETING') && <Animated.View entering={FadeIn.duration(220)} style={styles.liveMissionHeader}>
          <Text style={styles.liveMissionCode}>{status === 'COMPLETING' ? 'VERIFYING // CANONICAL' : 'MISSION ACTIVE // LIVE'}</Text>
          <Text style={styles.liveMissionTitle}>{quest.title}</Text>
          <Text style={styles.liveMissionHint}>{status === 'COMPLETING' ? 'Nie zamykaj ekranu. SYSTEM zapisuje wynik i nagrodę.' : 'Wykonuj cel. Weryfikacja działa na żywo.'}</Text>
        </Animated.View>}

        {adultPhotoEnabled && (status === 'TRACKING' || localPhotoUri !== null) && (
          <View style={styles.privatePhotoPanel}>
            <Text style={styles.privatePhotoHeader}>CAMERA // PRYWATNY PODGLĄD</Text>
            <Text style={styles.privatePhotoHint}>Opcjonalne zdjęcie z aktywnej misji, dostępne tylko na tym ekranie. Nie zalicza misji, nie dodaje XP i nie jest wysyłane do chmury. Wykonuj je tylko w bezpiecznym miejscu.</Text>
            {localPhotoUri !== null && <Image source={{uri:localPhotoUri}} style={styles.privatePhotoImage} />}
            {localPhotoError !== null && <Text style={styles.privatePhotoError}>{localPhotoError}</Text>}
            {status === 'TRACKING' && (
              <Pressable accessibilityRole="button" disabled={localPhotoBusy}
                style={[styles.privatePhotoButton, localPhotoBusy && {opacity:0.35}]}
                onPress={() => {void takePrivatePhoto();}}>
                <Text style={styles.privatePhotoButtonText}>{localPhotoBusy ? 'URUCHAMIANIE APARATU…' : localPhotoUri ? 'ZRÓB NOWE ZDJĘCIE' : 'ZRÓB PRYWATNE ZDJĘCIE'}</Text>
              </Pressable>
            )}
          </View>
        )}

        {antiCheatRisk.score>0&&<View style={[styles.questCard,{borderColor:antiCheatRisk.action==='REJECT'?'#ff6b6b':'#ffcf6a'}]}>
          <Text style={styles.category}>ANTI-CHEAT 2.0 // {antiCheatRisk.action} // RISK {antiCheatRisk.score}</Text>
          <Text style={styles.description}>{antiCheatRisk.signals.map(x=>x.kind).join(' · ')}</Text>
        </View>}
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
          <View style={styles.errorActions}>
            <Pressable accessibilityRole="button" accessibilityLabel="Przejdź do questów" onPress={() => router.replace('/quests')}><Text style={styles.retry}>QUEST HUB →</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Wróć do Home" onPress={() => router.replace('/')}><Text style={styles.retry}>HOME →</Text></Pressable>
          </View>
        </View>}

        {!ready && <View style={styles.errorBox}>
          <Text style={styles.errorText}>{databaseError ?? 'Trwa odczyt profilu SYSTEMU...'}</Text>
          {databaseError && <View style={styles.errorActions}>
            <Pressable accessibilityRole="button" accessibilityLabel="Ponów odczyt profilu" onPress={() => { void refreshPlayer(); }}>
              <Text style={styles.retry}>PONÓW ODCZYT →</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Wróć do Home" onPress={() => router.replace('/')}>
              <Text style={styles.retry}>HOME →</Text>
            </Pressable>
          </View>}
        </View>}

        {renderStatus === 'READY' && distance > 0 && !isTimer && <View style={styles.trackingBox}><Text style={styles.trackingText}>ZAPISANY POSTĘP · {Math.floor(distance)} M</Text><Text style={styles.description}>Wznów zapisaną próbę. Aktywna misja ruchowa może mierzyć dystans w tle przy wymaganych uprawnieniach.</Text></View>}
        {renderStatus === 'READY' && quest.category === 'DAILY' && !!quest.activityType && <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: extendedGoal }} onPress={() => chooseExtendedGoal(!extendedGoal)} style={styles.optionButton}>
          <Text style={styles.retry}>{extendedGoal ? '✓ ' : ''}CEL ROZSZERZONY 125%</Text>
          <Text style={styles.description}>Wybór przed startem. Automatyczne ukończenie nastąpi po dłuższym dystansie.</Text>
        </Pressable>}
        {rematch && <Text style={styles.retry}>SYSTEM MESSAGE // REMATCH AVAILABLE</Text>}

        {(renderStatus === 'DENIED' || renderStatus === 'ERROR') && <QuestRecoveryPanel
          title={renderStatus === 'DENIED' ? 'BRAK DOSTĘPU DO WERYFIKACJI' : rematch ? 'REMATCH AVAILABLE' : 'PRÓBA ZATRZYMANA'}
          message={error}
          onRetry={() => { void retryQuest(); }}
          onSettings={renderStatus === 'DENIED' ? () => { void Linking.openSettings(); } : undefined}
          onHub={() => router.replace('/quests')}
          onHome={() => router.replace('/')}
        />}

        {quest.verification.type === 'MULTI' && showLiveTracker && <MultiProgress
          distance={distance} duration={duration} meters={quest.verification.minimumDistanceMeters}
          seconds={quest.verification.minimumDurationSeconds} />}

        {receipt && <RewardSummary receipt={receipt} />}
        {renderStatus ===
          'COMPLETED' && (
          <Animated.View
            entering={FadeInUp.duration(420)}
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
            {!alreadyCompleted && <View style={styles.nextProtocol}>
              <Text style={styles.nextProtocolCode}>NEXT PROTOCOL</Text>
              <Text style={styles.nextProtocolTitle}>{nextAction.title}</Text>
              <Text style={styles.nextProtocolDetail}>{nextAction.detail}</Text>
            </View>}

            <Pressable accessibilityRole="button"
              style={
                styles.returnButton
              }
              onPress={alreadyCompleted ? () => router.replace('/quests') : continueSystem}
            >
              <Text
                style={
                  styles.returnText
                }
              >
                {alreadyCompleted ? 'WRÓĆ DO QUEST HUB' : nextAction.title}
              </Text>
            </Pressable>
            <View style={styles.completeActions}>
              {!alreadyCompleted && nextAction.route !== '/quests' && <Pressable accessibilityRole="button" onPress={() => router.replace('/quests')}><Text style={styles.completeLink}>QUEST HUB</Text></Pressable>}
              <Pressable accessibilityRole="button" onPress={() => router.replace('/')}><Text style={styles.completeLink}>HOME</Text></Pressable>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {questAccepted && (
        <Animated.View pointerEvents="none" entering={FadeIn.duration(220)} exiting={FadeOut.duration(220)} style={styles.questOverlay}>
          <Text style={styles.questOverlayLabel}>QUEST ACCEPTED</Text>
          <Text style={styles.questOverlayTitle}>{quest.title}</Text>
        </Animated.View>
      )}

    </View>
  );
}

function isLiveQuestStatus(status: string) {
  return status === 'TRACKING' || status === 'COMPLETING';
}

const styles =
  StyleSheet.create({
    completeActions: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 16 },
    completeLink: { color: SYSTEM_COLORS.cyan, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
    liveMissionHeader: { marginTop: 12, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: SYSTEM_COLORS.lineBright, backgroundColor: 'rgba(0,229,255,0.05)' },
    liveMissionCode: { color: SYSTEM_COLORS.cyan, fontSize: 8, fontWeight: '900', letterSpacing: 1.5 },
    liveMissionTitle: { color: SYSTEM_COLORS.white, fontSize: 20, fontWeight: '900', marginTop: 7 },
    liveMissionHint: { color: SYSTEM_COLORS.textMuted, fontSize: 10, lineHeight: 15, marginTop: 6 },
    nextProtocol: { width: '100%', marginTop: 18, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: SYSTEM_COLORS.lineBright, backgroundColor: 'rgba(0,229,255,0.045)' },
    nextProtocolCode: { color: SYSTEM_COLORS.cyan, fontSize: 8, fontWeight: '900', letterSpacing: 1.4 },
    nextProtocolTitle: { color: SYSTEM_COLORS.white, fontSize: 15, fontWeight: '900', marginTop: 6 },
    nextProtocolDetail: { color: SYSTEM_COLORS.textMuted, fontSize: 10, lineHeight: 15, marginTop: 5 },
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

    topTitle: { flex: 1, minWidth: 0 },

    systemLabel: {
      color:
        SYSTEM_COLORS.cyan,
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 2.2,
      lineHeight: 15,
      flexShrink: 1,
    },

    screenTitle: {
      color:
        SYSTEM_COLORS.white,
      fontSize: 26,
      lineHeight: 32,
      fontWeight: '900',
      marginTop: 4,
      flexShrink: 1,
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
      letterSpacing: 1.4,
      lineHeight: 16,
      flexShrink: 1,
    },

    difficulty: {
      color:
        SYSTEM_COLORS.textMuted,
      fontWeight: '900',
      fontSize: 9,
      letterSpacing: 1.25,
      lineHeight: 16,
      flexShrink: 1,
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
      flex: 1,
      minWidth: 0,
      textAlign: 'center',
      color:
        SYSTEM_COLORS.cyan,
      fontSize: 10,
      lineHeight: 16,
      fontWeight: '900',
      letterSpacing: 1.15,
      flexShrink: 1,
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

    errorActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginTop: 2 },

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
    privatePhotoPanel: {
      borderWidth: 1, borderColor: SYSTEM_COLORS.lineBright,
      borderRadius: 18, padding: 16, marginTop: 14,
      backgroundColor: '#06171d',
    },
    privatePhotoHeader: {color: SYSTEM_COLORS.cyan, fontSize: 10, fontWeight: '900', letterSpacing: 1.2},
    privatePhotoHint: {color: SYSTEM_COLORS.textMuted, marginTop: 7, fontSize: 11, lineHeight: 17},
    privatePhotoImage: {width: '100%', height: 190, borderRadius: 12, marginTop: 12},
    privatePhotoError: {color: '#ff9a8d', fontSize: 11, marginTop: 9},
    privatePhotoButton: {
      marginTop: 12, minHeight: 48, borderRadius: 12,
      backgroundColor: SYSTEM_COLORS.cyan, alignItems: 'center', justifyContent: 'center',
    },
    privatePhotoButtonText: {color: '#001014', fontWeight: '900', fontSize: 11},
  });
