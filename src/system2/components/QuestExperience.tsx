import { FadeInUp } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { RunnableQuest } from '../quests/types';
import { SYSTEM_COLORS as C } from '../core';

type QuestStatus = 'AVAILABLE' | 'ACTIVE' | 'COMPLETED' | 'LOCKED' | 'STARTING' | 'VERIFYING' | 'FAILED' | 'CHECKING';

const STATUS_LABELS: Record<QuestStatus, string> = {
  AVAILABLE: 'AVAILABLE', ACTIVE: 'ACTIVE', COMPLETED: 'COMPLETED', LOCKED: 'LOCKED',
  STARTING: 'STARTING', VERIFYING: 'VERIFYING', FAILED: 'FAILED', CHECKING: 'CHECKING',
};

export function questCategoryLabel(category: RunnableQuest['category']) {
  return category.replaceAll('_', ' ');
}

export function questVerificationLabel(quest: RunnableQuest) {
  if (quest.verification.type === 'MULTI') return 'GPS + TIMER';
  if (quest.verification.type === 'TIMER') return 'FOCUS / TIMER';
  return 'GPS DISTANCE';
}

export function questStatusForRun(status: string): QuestStatus {
  if (status === 'READY') return 'AVAILABLE';
  if (status === 'TRACKING') return 'ACTIVE';
  if (status === 'COMPLETING') return 'VERIFYING';
  if (status === 'DENIED' || status === 'ERROR') return 'FAILED';
  if (status in STATUS_LABELS) return status as QuestStatus;
  return 'CHECKING';
}

export function QuestStatusBadge({ status }: { status: QuestStatus }) {
  return <View accessibilityLabel={`Quest status ${STATUS_LABELS[status]}`} style={[styles.badge, styles[`badge${status}`]]}>
    <Text style={[styles.badgeText, styles[`badgeText${status}`]]}>{STATUS_LABELS[status]}</Text>
  </View>;
}

export function QuestRewardRow({ quest, label = 'REWARD' }: { quest: RunnableQuest; label?: string }) {
  const skillRewards = Object.entries(quest.rewards.skillXp ?? {});
  return <View style={styles.rewardBlock}>
    <Text style={styles.metaLabel}>{label}</Text>
    <View style={styles.rewardList}>
      <Text style={styles.rewardValue}>+{quest.rewards.realXp} REAL XP</Text>
      {skillRewards.map(([skill, xp]) => <Text key={skill} style={styles.rewardValue}>+{xp} {skill} XP</Text>)}
      {!!quest.rewards.gameEnergy && <Text style={styles.rewardValue}>+{quest.rewards.gameEnergy} ENERGY</Text>}
    </View>
  </View>;
}

export function QuestProgressBar({ value, max, label = 'OBJECTIVE PROGRESS' }: { value: number; max: number; label?: string }) {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 0;
  const safeValue = Number.isFinite(value) && safeMax > 0 ? Math.min(safeMax, Math.max(0, value)) : 0;
  const percent = safeMax > 0 ? Math.round(safeValue / safeMax * 100) : 0;
  return <View accessible accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max: 100, now: percent }} style={styles.progressBlock}>
    <View style={styles.progressHeader}><Text style={styles.metaLabel}>{label}</Text><Text style={styles.progressValue}>{safeValue} / {safeMax || '—'}</Text></View>
    <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${percent}%` }]} /></View>
  </View>;
}

export function QuestMissionCard({ quest, status, progress, progressTarget, disabled = false, onPress, index = 0, contextLabel }: {
  quest: RunnableQuest;
  status: QuestStatus;
  progress?: number;
  progressTarget?: number;
  disabled?: boolean;
  onPress: () => void;
  index?: number;
  contextLabel?: string;
}) {
  const hasProgress = Number.isFinite(progress) && Number.isFinite(progressTarget) && (progressTarget ?? 0) > 0;
  return <Animated.View entering={FadeInUp.duration(360).delay(index * 45)}>
    <Pressable accessibilityRole="button" accessibilityLabel={`${quest.title} — ${STATUS_LABELS[status]}`} accessibilityState={{ disabled, selected: status === 'ACTIVE' }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.card, status === 'ACTIVE' && styles.cardActive, status === 'LOCKED' && styles.cardLocked, pressed && styles.cardPressed]}>
      <View style={styles.cardHeader}>
        <View style={styles.headerTags}><Text style={styles.category}>{questCategoryLabel(quest.category)}</Text><Text style={styles.difficulty}>{quest.difficulty}</Text></View>
        <QuestStatusBadge status={status} />
      </View>
      {!!contextLabel && <Text style={styles.contextLabel}>{contextLabel}</Text>}
      <Text style={styles.cardTitle}>{quest.title}</Text>
      <Text style={styles.description}>{quest.description}</Text>
      <View style={styles.infoRow}>
        <Info label="VERIFY" value={questVerificationLabel(quest)} />
        <Info label="SKILL" value={[quest.primarySkill, ...(quest.secondarySkills ?? [])].join(' + ')} />
      </View>
      {hasProgress && <QuestProgressBar value={progress!} max={progressTarget!} />}
      <QuestRewardRow quest={quest} />
      <Text style={[styles.openLabel, status === 'LOCKED' && styles.lockedLabel]}>{status === 'LOCKED' ? 'MISSION LOCKED' : status === 'COMPLETED' ? 'VIEW MISSION REPORT' : status === 'ACTIVE' ? 'RESUME MISSION' : 'OPEN MISSION BRIEFING'} <Text style={styles.arrow}>→</Text></Text>
    </Pressable>
  </Animated.View>;
}

export function MissionBriefing({ quest, status, onStart, startDisabled }: { quest: RunnableQuest; status: string; onStart?: () => void; startDisabled?: boolean }) {
  const displayStatus = questStatusForRun(status);
  const objective = quest.verification.type === 'TIMER' ? `${Math.floor((quest.verification.minimumDurationSeconds ?? 0) / 60)} MIN FOCUS` : quest.verification.type === 'MULTI' ? `${quest.verification.minimumDistanceMeters ?? 0} M + ${Math.floor((quest.verification.minimumDurationSeconds ?? 0) / 60)} MIN` : `${quest.verification.minimumDistanceMeters ?? 0} M`;
  return <View style={styles.briefing}>
    <View style={styles.cardHeader}><Text style={styles.category}>MISSION BRIEFING</Text><QuestStatusBadge status={displayStatus} /></View>
    <Text style={styles.briefingType}>{questCategoryLabel(quest.category)} // {quest.difficulty}</Text>
    <Text style={styles.briefingTitle}>{quest.title}</Text>
    <Text style={styles.description}>{quest.description}</Text>
    <View style={styles.briefingGrid}>
      <Info label="OBJECTIVE" value={objective} />
      <Info label="VERIFICATION" value={questVerificationLabel(quest)} />
      <Info label="PRIMARY SKILL" value={quest.primarySkill} />
    </View>
    <QuestRewardRow quest={quest} />
    {onStart && <Pressable accessibilityRole="button" accessibilityLabel="Start mission" accessibilityState={{ disabled: startDisabled }} disabled={startDisabled} onPress={onStart} style={({ pressed }) => [styles.startButton, startDisabled && styles.startButtonDisabled, pressed && styles.startButtonPressed]}>
      <Text style={styles.startButtonText}>{startDisabled ? 'STARTING...' : 'START MISSION'}</Text><Text style={styles.startArrow}>→</Text>
    </Pressable>}
  </View>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <View style={styles.info}><Text style={styles.metaLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  card: { marginTop: 12, padding: 18, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, borderRadius: 20 },
  cardActive: { borderColor: C.lineBright, backgroundColor: C.panelSoft },
  cardLocked: { opacity: 0.56 },
  cardPressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  headerTags: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  category: { color: C.cyan, fontSize: 9, fontWeight: '900', letterSpacing: 1.6 },
  difficulty: { color: C.textMuted, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  badge: { paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1, borderRadius: 999 },
  badgeText: { fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  badgeAVAILABLE: { borderColor: C.cyanDark, backgroundColor: 'rgba(0,229,255,0.06)' },
  badgeACTIVE: { borderColor: C.success, backgroundColor: 'rgba(54,230,154,0.08)' },
  badgeCOMPLETED: { borderColor: C.success, backgroundColor: 'rgba(54,230,154,0.06)' },
  badgeLOCKED: { borderColor: C.textVeryMuted, backgroundColor: 'rgba(57,70,75,0.14)' },
  badgeSTARTING: { borderColor: C.warning, backgroundColor: 'rgba(255,200,87,0.07)' },
  badgeVERIFYING: { borderColor: C.warning, backgroundColor: 'rgba(255,200,87,0.07)' },
  badgeFAILED: { borderColor: C.danger, backgroundColor: 'rgba(255,80,103,0.08)' },
  badgeCHECKING: { borderColor: C.lineBright, backgroundColor: 'rgba(0,122,138,0.08)' },
  badgeTextAVAILABLE: { color: C.cyan }, badgeTextACTIVE: { color: C.success }, badgeTextCOMPLETED: { color: C.success },
  badgeTextLOCKED: { color: C.textMuted }, badgeTextSTARTING: { color: C.warning }, badgeTextVERIFYING: { color: C.warning },
  badgeTextFAILED: { color: C.danger }, badgeTextCHECKING: { color: C.cyanSoft },
  cardTitle: { color: C.white, fontSize: 21, lineHeight: 27, fontWeight: '900', marginTop: 14 },
  description: { color: C.textMuted, fontSize: 12, lineHeight: 19, marginTop: 8 },
  infoRow: { flexDirection: 'row', gap: 16, marginTop: 16 },
  info: { flex: 1, minWidth: 0 },
  metaLabel: { color: C.textVeryMuted, fontSize: 8, fontWeight: '900', letterSpacing: 1.3 },
  infoValue: { color: C.text, fontSize: 11, lineHeight: 16, fontWeight: '900', marginTop: 5 },
  rewardBlock: { marginTop: 16 },
  rewardList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 7 },
  rewardValue: { color: C.cyan, fontSize: 10, fontWeight: '900' },
  progressBlock: { marginTop: 16 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  progressValue: { color: C.text, fontSize: 9, fontWeight: '900' },
  progressTrack: { height: 5, marginTop: 8, backgroundColor: C.line, borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: C.cyan },
  openLabel: { color: C.white, fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginTop: 18 },
  contextLabel: { color: C.warning, fontSize: 9, fontWeight: '900', letterSpacing: 1.1, marginTop: 10 },
  lockedLabel: { color: C.textMuted },
  arrow: { color: C.cyan, fontSize: 16 },
  briefing: { padding: 20, marginTop: 8, backgroundColor: C.panel, borderWidth: 1, borderColor: C.lineBright, borderRadius: 22 },
  briefingType: { color: C.textMuted, fontSize: 9, fontWeight: '900', letterSpacing: 1.4, marginTop: 17 },
  briefingTitle: { color: C.white, fontSize: 28, lineHeight: 33, fontWeight: '900', marginTop: 9 },
  briefingGrid: { flexDirection: 'row', gap: 10, marginTop: 20 },
  startButton: { minHeight: 62, marginTop: 20, paddingHorizontal: 18, borderRadius: 14, backgroundColor: C.cyan, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  startButtonDisabled: { opacity: 0.5 },
  startButtonPressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  startButtonText: { color: '#001014', fontSize: 13, fontWeight: '900', letterSpacing: 1.5 },
  startArrow: { color: '#001014', fontSize: 27 },
});