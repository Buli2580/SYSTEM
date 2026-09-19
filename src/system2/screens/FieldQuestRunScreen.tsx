import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SYSTEM_COLORS as C } from '../core';
import type { RunnableQuest } from '../quests/types';
import { FieldQuestSessionManager } from '../fieldquest/sessionManager';
import { getDeviceReadiness } from '../fieldquest/permissions';
import { buildDiagnosticsData, formatDiagnosticsForConsole } from '../fieldquest/diagnostics';
import SystemAmbientBackground from '../components/SystemAmbientBackground';
import { usePresentation, PresentationEventPresets } from '../presentation/PresentationContext';
import { telemetry } from '../telemetry/TelemetryProvider';
import type { FieldQuestStatus } from '../fieldquest/types';
import type { GPSQuestTrackerState } from '../fieldquest/types';
import type { DeviceReadiness } from '../fieldquest/types';
import type { FieldQuestProgress } from '../fieldquest/types';
import type { FieldQuestResult } from '../fieldquest/types';

export default function FieldQuestRunScreen({ quest }: { quest?: RunnableQuest } = {}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<FieldQuestStatus>('CHECKING');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<FieldQuestProgress>({ distanceMeters: 0, durationSeconds: 0, sampleCount: 0, currentAccuracy: null, lastUpdate: Date.now() });
  const [gpsState, setGpsState] = useState<GPSQuestTrackerState | null>(null);
  const [readiness, setReadiness] = useState<DeviceReadiness>({ permissions: { location: 'UNKNOWN' }, location: 'UNKNOWN', gpsAvailable: false, ready: false, blockingIssues: [] });
  const [sessionActive, setSessionActive] = useState(false);
  const [diagnostics, setDiagnostics] = useState<string>('');
  const [lastReward, setLastReward] = useState<FieldQuestResult['reward'] | null>(null);

  const sessionManagerRef = useRef<FieldQuestSessionManager | null>(null);
  const diagnosticsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { triggerPreset } = usePresentation();
  const seenCompletionRef = useRef(false);

  // Trigger quest complete presentation when status changes to COMPLETED
  useEffect(() => {
    if (status === 'COMPLETED' && !seenCompletionRef.current && lastReward) {
      seenCompletionRef.current = true;
      triggerPreset('questComplete', quest?.id, quest?.title, lastReward);
    } else if (status !== 'COMPLETED') {
      seenCompletionRef.current = false;
    }
  }, [status, lastReward, quest]);

const checkReadiness = async () => {
    const ready = await getDeviceReadiness();
    setReadiness(ready);
    if (!ready.ready && status === 'CHECKING') {
      setStatus('ERROR');
      setError(ready.blockingIssues.join(', '));
    } else if (status === 'CHECKING') {
      setStatus('READY');
    }
  };

  useEffect(() => {
    checkReadiness();
    return () => {
      if (diagnosticsIntervalRef.current) clearInterval(diagnosticsIntervalRef.current);
    };
  }, [quest?.id]);

  const handleStart = async () => {
    if (!quest) return;
    setError(null);
    setStatus('STARTING');
    try {
      const manager = sessionManagerRef.current;
      if (!manager) return;
      const result = await manager.start(quest);
      if (!result.success) {
        setError(result.error || 'Failed to start quest');
        setStatus('ERROR');
        return;
      }
      triggerPreset('questAccepted', quest.id, quest.title);
      setSessionActive(true);
      await telemetry.trackEvent('quest_started', { questId: quest.id });
    } catch (e) {
      setError('Failed to start quest');
      setStatus('ERROR');
    }
  };

  const handlePause = () => {
    sessionManagerRef.current?.pause();
  };

  const handleResume = () => {
    sessionManagerRef.current?.resume();
  };

  const handleCancel = () => {
    sessionManagerRef.current?.cancel();
    setSessionActive(false);
    router.back();
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
    return `${Math.round(meters)} m`;
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  if (!quest) {
    return <View style={styles.container}><Text style={styles.errorText}>No quest specified</Text></View>;
  }

  const isTimer = quest.verification.type === 'TIMER';
  const isMulti = quest.verification.type === 'MULTI';

  const targetDistance = quest.verification.type !== 'TIMER' ? quest.verification.minimumDistanceMeters : 0;
  const targetDuration = quest.verification.type !== 'GPS_DISTANCE' ? quest.verification.minimumDurationSeconds : 0;
  const isDistanceQuest = quest.verification.type !== 'TIMER';
  const target = isDistanceQuest ? targetDistance : targetDuration;
  const current = isDistanceQuest ? progress.distanceMeters : progress.durationSeconds;
  const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const displayCurrent = isDistanceQuest ? formatDistance(current) : formatDuration(current);
  const displayTarget = isDistanceQuest ? formatDistance(target) : formatDuration(target);
  return (
    <View style={styles.container}>
      <SystemAmbientBackground mode={status === 'ACTIVE' ? 'QUEST' : 'CALM'} intensity={1} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 },
        ]}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View>
            <Text style={styles.systemLabel}>SYSTEM // FIELD QUEST</Text>
            <Text style={styles.screenTitle}>
              {quest.category === 'DAILY' ? 'DAILY PROTOCOL' : 'FIELD QUEST'}
            </Text>
          </View>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, status === 'ACTIVE' && styles.statusActive, status === 'PAUSED' && styles.statusPaused, status === 'COMPLETED' && styles.statusCompleted, status === 'ERROR' && styles.statusError]} />
            <Text style={[styles.statusLabel, status === 'ACTIVE' && styles.statusActiveText, status === 'PAUSED' && styles.statusPausedText, status === 'COMPLETED' && styles.statusCompletedText, status === 'ERROR' && styles.statusErrorText]}>
              {status}
            </Text>
          </View>
        </View>

        <View style={styles.questCard}>
          <Text style={styles.questTitle}>{quest.title}</Text>
          <Text style={styles.questDescription}>{quest.description}</Text>

          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>
              {isTimer ? 'DURATION' : isMulti ? 'DISTANCE / TIME' : 'DISTANCE'}
            </Text>
            <View style={styles.progressMain}>
              <Text style={styles.progressValue}>{displayCurrent}</Text>
              <Text style={styles.progressTarget}>/ {displayTarget}</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
              </View>
              <Text style={styles.progressPercent}>{percent}%</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{progress.sampleCount}</Text>
              <Text style={styles.statLabel}>SAMPLES</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{progress.currentAccuracy !== null ? `${Math.round(progress.currentAccuracy)}m` : '--'}</Text>
              <Text style={styles.statLabel}>ACCURACY</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{gpsState?.trackingStatus || 'IDLE'}</Text>
              <Text style={styles.statLabel}>GPS</Text>
            </View>
          </View>

          {readiness.blockingIssues.length > 0 && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>{readiness.blockingIssues.join(', ')}</Text>
            </View>
          )}
        </View>

        {status === 'READY' && (
          <Pressable style={styles.startButton} onPress={handleStart}>
            <Text style={styles.startButtonText}>START QUEST</Text>
          </Pressable>
        )}

        {status === 'ACTIVE' && (
          <View style={styles.actionRow}>
            <Pressable style={styles.pauseButton} onPress={handlePause}>
              <Text style={styles.actionButtonText}>PAUSE</Text>
            </Pressable>
            <Pressable style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.actionButtonText}>CANCEL</Text>
            </Pressable>
          </View>
        )}

        {status === 'PAUSED' && (
          <View style={styles.actionRow}>
            <Pressable style={styles.resumeButton} onPress={handleResume}>
              <Text style={styles.actionButtonText}>RESUME</Text>
            </Pressable>
            <Pressable style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.actionButtonText}>CANCEL</Text>
            </Pressable>
          </View>
        )}

        {status === 'VERIFYING' && (
          <View style={styles.verifyingCard}>
            <Text style={styles.verifyingTitle}>VERIFYING...</Text>
            <Text style={styles.verifyingText}>Analyzing activity data and GPS samples</Text>
          </View>
        )}

        {status === 'COMPLETED' && (
          <View style={styles.completeCard}>
            <Text style={styles.completeTitle}>QUEST COMPLETE</Text>
            {lastReward && (
              <View>
                <Text style={styles.completeText}>Rewards claimed successfully.</Text>
                <View style={styles.rewardRow}>
                  <Text style={styles.rewardItem}>
                    <Text style={styles.rewardLabel}>XP: </Text>
                    <Text style={styles.rewardValue}>+{lastReward.realXp}</Text>
                  </Text>
                  {Object.entries(lastReward.skillXp ?? {}).map(([skill, xp]) => (
                    <Text key={skill} style={styles.rewardItem}>
                      <Text style={styles.rewardLabel}>{skill}: </Text>
                      <Text style={styles.rewardValue}>+{xp}</Text>
                    </Text>
                  ))}
                  <Text style={styles.rewardItem}>
                    <Text style={styles.rewardLabel}>Energy: </Text>
                    <Text style={styles.rewardValue}>+{lastReward.energy}</Text>
                  </Text>
                </View>
              </View>
            )}
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backText}>BACK</Text>
            </Pressable>
          </View>
        )}

        {status === 'FAILED' && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>QUEST FAILED</Text>
            <Text style={styles.errorText}>{error || 'Unknown error'}</Text>
            <Pressable style={styles.retryButton} onPress={handleStart}>
              <Text style={styles.retryButtonText}>RETRY</Text>
            </Pressable>
            <Pressable style={styles.errorBackButton} onPress={() => router.back()}>
              <Text style={styles.errorBackButtonText}>BACK</Text>
            </Pressable>
          </View>
        )}

        {status === 'ERROR' && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>ERROR</Text>
            <Text style={styles.errorText}>{error || 'Unknown error'}</Text>
            <Pressable style={styles.retryButton} onPress={handleStart}>
              <Text style={styles.retryButtonText}>RETRY</Text>
            </Pressable>
            <Pressable style={styles.errorBackButton} onPress={() => router.back()}>
              <Text style={styles.errorBackButtonText}>BACK</Text>
            </Pressable>
          </View>
        )}

        {__DEV__ && diagnostics && (
          <View style={styles.diagnosticsCard}>
            <Text style={styles.diagnosticsTitle}>DIAGNOSTICS (DEV)</Text>
            <Text style={styles.diagnosticsText}>{diagnostics}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  backButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  backText: { color: C.cyan, fontSize: 28, lineHeight: 32 },
  systemLabel: { color: C.cyan, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  screenTitle: { color: C.white, fontSize: 22, fontWeight: '900', marginTop: 4 },
  statusCard: { backgroundColor: '#061116', borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 16, marginBottom: 16 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: C.textMuted },
  statusActive: { backgroundColor: C.success },
  statusPaused: { backgroundColor: C.warning },
  statusCompleted: { backgroundColor: C.success },
  statusError: { backgroundColor: C.danger },
  statusLabel: { color: C.white, fontSize: 14, fontWeight: '900' },
  statusActiveText: { color: C.success },
  statusPausedText: { color: C.warning },
  statusCompletedText: { color: C.success },
  statusErrorText: { color: C.danger },
  questCard: { backgroundColor: '#061116', borderWidth: 1, borderColor: C.line, borderRadius: 20, padding: 20, marginBottom: 16 },
  questTitle: { color: C.white, fontSize: 24, fontWeight: '900', marginBottom: 8 },
  questDescription: { color: C.textMuted, fontSize: 13, lineHeight: 20, marginBottom: 16 },
  progressContainer: { marginBottom: 16 },
  progressLabel: { color: C.cyan, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8 },
  progressMain: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  progressValue: { color: C.white, fontSize: 36, fontWeight: '900' },
  progressTarget: { color: C.textMuted, fontSize: 20, fontWeight: '900' },
  progressBarContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  progressBarTrack: { flex: 1, height: 8, backgroundColor: '#09252C', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: C.cyan, borderRadius: 4 },
  progressPercent: { color: C.cyan, fontSize: 14, fontWeight: '900', minWidth: 50, textAlign: 'right' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.line },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { color: C.white, fontSize: 20, fontWeight: '900' },
  statLabel: { color: C.textVeryMuted, fontSize: 8, fontWeight: '900', letterSpacing: 1, marginTop: 4 },
  warningBox: { marginTop: 16, padding: 12, backgroundColor: 'rgba(255,180,0,0.1)', borderWidth: 1, borderColor: C.warning, borderRadius: 10 },
  warningText: { color: C.warning, fontSize: 11, fontWeight: '900', textAlign: 'center' },
  startButton: { height: 60, borderRadius: 16, backgroundColor: C.cyan, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  startButtonText: { color: '#001014', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  pauseButton: { flex: 1, height: 56, borderRadius: 14, backgroundColor: C.warning, alignItems: 'center', justifyContent: 'center' },
  resumeButton: { flex: 1, height: 56, borderRadius: 14, backgroundColor: C.success, alignItems: 'center', justifyContent: 'center' },
  cancelButton: { flex: 1, height: 56, borderRadius: 14, backgroundColor: C.danger, alignItems: 'center', justifyContent: 'center' },
  actionButtonText: { color: '#001014', fontSize: 14, fontWeight: '900', letterSpacing: 1.5 },
  completeCard: { backgroundColor: '#061512', borderWidth: 1, borderColor: C.success, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16 },
  completeTitle: { color: C.success, fontSize: 22, fontWeight: '900', marginBottom: 8 },
  completeText: { color: C.textMuted, fontSize: 13, textAlign: 'center', marginBottom: 16 },
  errorCard: { backgroundColor: '#1a0a0a', borderWidth: 1, borderColor: C.danger, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16 },
  errorTitle: { color: C.danger, fontSize: 22, fontWeight: '900', marginBottom: 8 },
  errorText: { color: C.textMuted, fontSize: 13, textAlign: 'center', marginBottom: 16 },
  retryButton: { height: 50, borderRadius: 12, backgroundColor: C.cyan, alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: 8 },
  retryButtonText: { color: '#001014', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  errorBackButton: { height: 50, borderRadius: 12, backgroundColor: '#0c2931', alignItems: 'center', justifyContent: 'center', width: '100%' },
  errorBackButtonText: { color: C.cyan, fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  diagnosticsCard: { marginTop: 20, padding: 16, backgroundColor: '#03080a', borderWidth: 1, borderColor: C.line, borderRadius: 12 },
  diagnosticsTitle: { color: C.cyan, fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
  diagnosticsText: { color: C.textMuted, fontSize: 9, fontFamily: 'monospace', lineHeight: 16 },
  verifyingCard: { backgroundColor: '#061116', borderWidth: 1, borderColor: C.warning, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16 },
  verifyingTitle: { color: C.warning, fontSize: 22, fontWeight: '900', marginBottom: 8 },
  verifyingText: { color: C.textMuted, fontSize: 13, textAlign: 'center' },
  rewardRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 16 },
  rewardItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rewardLabel: { color: C.textMuted, fontSize: 13, fontWeight: '900' },
  rewardValue: { color: C.cyan, fontSize: 13, fontWeight: '900' },
});

const insets = { top: 0, bottom: 0 };