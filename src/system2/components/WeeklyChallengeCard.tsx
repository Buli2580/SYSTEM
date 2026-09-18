import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SYSTEM_COLORS as C } from '../core';
import type { WeeklyChallengeProgress } from '../weekly/challenges';

interface WeeklyChallengeCardProps {
  progress: WeeklyChallengeProgress;
  onPress?: () => void;
  compact?: boolean;
}

export default function WeeklyChallengeCard({ progress, onPress, compact = false }: WeeklyChallengeCardProps) {
  const { challenge, currentProgress, isComplete, percentComplete, status } = progress;
  const isLocked = status === 'LOCKED';
  const isExpired = status === 'EXPIRED';

  const categoryColors = {
    QUESTS: C.cyan,
    ACTIVITY: C.success,
    STREAK: C.warning,
    DAILY: '#d4adff',
  };
  const categoryColor = categoryColors[challenge.category];

  if (compact) {
    return (
      <Pressable onPress={onPress} disabled={isLocked || isExpired} style={({ pressed }) => [
        styles.compactCard,
        pressed && styles.compactCardPressed,
        (isLocked || isExpired) && styles.compactCardDisabled,
      ]}>
        <View style={[styles.compactBar, { backgroundColor: categoryColor }]} />
        <View style={styles.compactContent}>
          <View style={styles.compactHeader}>
            <Text style={styles.compactName}>{challenge.title}</Text>
            <Text style={[styles.compactStatus, { color: getStatusColor(status) }]}>{status}</Text>
          </View>
          <View style={styles.compactProgressTrack}>
            <View style={[styles.compactProgressFill, { width: `${percentComplete}%`, backgroundColor: categoryColor }]} />
          </View>
          <View style={styles.compactMeta}>
            <Text style={styles.compactMetaText}>{currentProgress} / {challenge.target}</Text>
            <Text style={styles.compactMetaText}>+{challenge.rewardXp} XP</Text>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} disabled={isLocked || isExpired} style={({ pressed }) => [
      styles.card,
      pressed && styles.cardPressed,
      (isLocked || isExpired) && styles.cardDisabled,
    ]}>
      <View style={[styles.accentBar, { backgroundColor: categoryColor }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{challenge.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(status) }]}>{status}</Text>
          </View>
        </View>

        <Text style={styles.category}>{challenge.category}</Text>

        <Text style={styles.description}>{challenge.description}</Text>

        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>{percentComplete}%</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${percentComplete}%`, backgroundColor: categoryColor }]} />
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>PROGRESS</Text>
            <Text style={[styles.metaValue, { color: categoryColor }]}>{currentProgress} / {challenge.target}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>REWARD</Text>
            <Text style={styles.metaValue}>+{challenge.rewardXp} REAL XP</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>ENERGY</Text>
            <Text style={styles.metaValue}>+{challenge.rewardEnergy} ENERGY</Text>
          </View>
        </View>

        {(isLocked || isExpired) && (
          <Text style={styles.lockedText}>{isLocked ? 'UNLOCKS THIS WEEK' : 'EXPIRED'}</Text>
        )}
      </View>
    </Pressable>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'LOCKED': return C.danger;
    case 'AVAILABLE': return C.cyan;
    case 'ACTIVE': return C.success;
    case 'COMPLETED': return C.success;
    case 'EXPIRED': return C.textMuted;
    default: return C.textMuted;
  }
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 22,
    backgroundColor: '#061116',
    padding: 18,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardDisabled: {
    opacity: 0.6,
  },
  accentBar: {
    position: 'absolute',
    width: 4,
    top: 0,
    bottom: 0,
    left: 0,
  },
  content: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    color: C.white,
    fontSize: 22,
    fontWeight: '900',
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  category: {
    color: C.textMuted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  description: {
    color: C.textMuted,
    fontSize: 12,
    lineHeight: 19,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  progressLabel: {
    color: C.cyan,
    fontSize: 14,
    fontWeight: '900',
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#09252C',
    overflow: 'hidden',
    marginHorizontal: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.line,
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
    color: C.white,
    fontSize: 12,
    fontWeight: '900',
    marginTop: 4,
  },
  lockedText: {
    color: C.textMuted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 8,
    textAlign: 'center',
  },
  // Compact styles
  compactCard: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 16,
    backgroundColor: '#061116',
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    overflow: 'hidden',
  },
  compactCardPressed: {
    opacity: 0.85,
  },
  compactCardDisabled: {
    opacity: 0.6,
  },
  compactBar: {
    position: 'absolute',
    width: 3,
    top: 0,
    bottom: 0,
    left: 0,
  },
  compactContent: {
    flex: 1,
    gap: 6,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactName: {
    color: C.white,
    fontSize: 14,
    fontWeight: '900',
  },
  compactStatus: {
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1,
  },
  compactProgressTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: '#09252C',
    overflow: 'hidden',
  },
  compactProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  compactMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  compactMetaText: {
    color: C.textMuted,
    fontSize: 10,
    fontWeight: '900',
  },
});