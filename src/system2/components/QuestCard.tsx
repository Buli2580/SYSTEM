import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SYSTEM_COLORS as C } from '../core';
import type { RunnableQuest } from '../quests/types';
import type { QuestCompletionDetails } from '../storage/database';

type QuestCardStatus = 'LOCKED' | 'AVAILABLE' | 'ACTIVE' | 'COMPLETED';

interface QuestCardProps {
  quest: RunnableQuest;
  status: QuestCardStatus;
  completion?: QuestCompletionDetails | null;
  onPress?: () => void;
  disabled?: boolean;
  showExtended?: boolean;
}

function getStatusConfig(status: QuestCardStatus) {
  switch (status) {
    case 'LOCKED':
      return { color: C.danger, bg: 'rgba(255,68,68,0.08)', label: 'LOCKED' };
    case 'AVAILABLE':
      return { color: C.cyan, bg: 'rgba(0,229,255,0.06)', label: 'AVAILABLE' };
    case 'ACTIVE':
      return { color: C.success, bg: 'rgba(0,200,100,0.08)', label: 'ACTIVE' };
    case 'COMPLETED':
      return { color: C.success, bg: 'rgba(0,200,100,0.08)', label: 'COMPLETED' };
  }
}

function formatDistance(meters: number) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(2)} KM` : `${Math.round(meters)} M`;
}

function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function QuestCard({
  quest,
  status,
  completion = null,
  onPress,
  disabled = false,
  showExtended = true,
}: QuestCardProps) {
  const config = getStatusConfig(status);
  const isMulti = quest.verification.type === 'MULTI';
  const target = quest.verification.type === 'TIMER'
    ? quest.verification.minimumDurationSeconds
    : quest.verification.minimumDistanceMeters;
  const targetDisplay = quest.verification.type === 'TIMER'
    ? formatDuration(target)
    : `${target} M`;

  const progressPercent = completion
    ? 100
    : status === 'ACTIVE'
      ? 50
      : 0;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || status === 'LOCKED'}
      accessibilityRole="button"
      accessibilityLabel={`${quest.title} — ${config.label}`}
      accessibilityState={{ disabled: disabled || status === 'LOCKED' }}
      style={({ pressed }) => [
        styles.root,
        pressed && styles.rootPressed,
        disabled && styles.rootDisabled,
      ]}
    >
      <View style={[styles.glowLine, { backgroundColor: config.color }]} />

      <View style={styles.header}>
        <Text style={styles.category}>
          {quest.category === 'BOSS' ? 'BOSS PROTOCOL' : quest.category === 'DAILY' ? 'DAILY PROTOCOL' : 'AWAKENING'}
        </Text>

        <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
          <Text style={[styles.status, { color: config.color }]}>{config.label}</Text>
        </View>
      </View>

      <Text style={styles.title}>{quest.title}</Text>

      <Text style={styles.description}>{quest.description}</Text>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>TARGET</Text>
          <Text style={styles.metaValue}>{targetDisplay}</Text>
        </View>

        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>PRIMARY SKILL</Text>
          <Text style={[styles.metaValue, { color: C.cyan }]}>{[quest.primarySkill, ...quest.secondarySkills].join(' + ')}</Text>
        </View>

        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>VERIFY</Text>
          <Text style={styles.metaValue}>
            {isMulti ? 'GPS + TIMER' : quest.verification.type}
            {quest.activityType ? ' + ACTIVITY' : ''}
          </Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.max(1, progressPercent)}%`, backgroundColor: config.color },
          ]}
        />
      </View>

      {showExtended && completion && (
        <View style={styles.completionInfo}>
          <Text style={[styles.infoLabel, { color: config.color }]}>COMPLETION DATA</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>Score: {completion.verificationScore}/100</Text>
            <Text style={styles.infoValue}>{completion.verificationType}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>Dist: {formatDistance(completion.distanceMeters)}</Text>
            <Text style={styles.infoValue}>Time: {formatDuration(completion.durationSeconds)}</Text>
          </View>
        </View>
      )}

      <View style={styles.rewardRow}>
        <Text style={styles.rewardLabel}>REWARD</Text>
        <View style={styles.rewards}>
          <Text style={styles.reward}>+{quest.rewards.realXp} REAL XP</Text>
          {Object.entries(quest.rewards.skillXp ?? {}).map(([skill, xp]) => (
            <Text key={skill} style={styles.reward}>+{xp} {skill} XP</Text>
          ))}
          <Text style={styles.reward}>+{quest.rewards.gameEnergy ?? 0} ENERGY</Text>
        </View>
      </View>

      {status === 'ACTIVE' && <Text style={styles.activeHint}>W TRAKCIE... Pozostaw ekran otwarty.</Text>}
      {status === 'COMPLETED' && !completion && <Text style={styles.activeHint}>Zweryfikowane. Nagroda zapisana.</Text>}
      {status === 'LOCKED' && <Text style={styles.lockedHint}>Ukończ poprzednią misję, by odblokować.</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: '#061116',
    padding: 18,
  },
  rootPressed: {
    opacity: 0.85,
  },
  rootDisabled: {
    opacity: 0.6,
  },

  glowLine: {
    position: 'absolute',
    width: 4,
    top: 0,
    bottom: 0,
    left: 0,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  category: {
    color: C.cyan,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
  },

  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  status: {
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  title: {
    color: C.white,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 13,
  },

  description: {
    color: C.textMuted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 8,
  },

  metaRow: {
    flexDirection: 'row',
    marginTop: 18,
  },

  metaItem: {
    flex: 1,
  },

  metaLabel: {
    color: C.textVeryMuted,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1.3,
  },

  metaValue: {
    color: C.text,
    fontSize: 10,
    fontWeight: '900',
    marginTop: 5,
  },

  progressTrack: {
    height: 5,
    borderRadius: 999,
    backgroundColor: '#09252C',
    overflow: 'hidden',
    marginTop: 16,
  },

  progressFill: {
    height: '100%',
    borderRadius: 999,
  },

  completionInfo: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: C.line,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 12,
    padding: 12,
  },

  infoLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 8,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },

  infoValue: {
    color: C.textMuted,
    fontSize: 10,
    fontWeight: '900',
  },

  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },

  rewardLabel: {
    color: C.textVeryMuted,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  rewards: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  reward: {
    color: C.cyan,
    fontSize: 10,
    fontWeight: '900',
  },

  activeHint: {
    color: C.success,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 14,
    textAlign: 'center',
  },

  lockedHint: {
    color: C.danger,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 14,
    textAlign: 'center',
  },
});