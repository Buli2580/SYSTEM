import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SYSTEM_COLORS as C } from '../core';
import type { StreakState } from '../daily/streak';

interface StreakCardProps {
  streak: StreakState;
  onPress?: () => void;
  compact?: boolean;
}

export default function StreakCard({ streak, onPress, compact = false }: StreakCardProps) {
  const { currentStreak, bestStreak, isTodayComplete, nextMilestone, progressToNextMilestone, newlyReachedMilestone } = streak;

  if (compact) {
    return (
      <Pressable onPress={onPress} style={styles.compactCard}>
        <View style={[styles.compactBar, { backgroundColor: currentStreak > 0 ? C.success : C.textMuted }]} />
        <View style={styles.compactContent}>
          <View style={styles.compactHeader}>
            <Text style={styles.compactLabel}>STREAK</Text>
            <Text style={[styles.compactValue, { color: currentStreak > 0 ? C.success : C.textMuted }]}>
              {currentStreak} DAY{currentStreak !== 1 ? 'S' : ''}
            </Text>
          </View>
          {nextMilestone && (
            <View style={styles.compactProgressTrack}>
              <View style={[styles.compactProgressFill, { width: `${progressToNextMilestone}%`, backgroundColor: C.cyan }]} />
            </View>
          )}
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.card}>
      <View style={[styles.accentBar, { backgroundColor: currentStreak > 0 ? C.success : C.textMuted }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>STREAK SYSTEM</Text>
          <Text style={[styles.currentStreak, { color: currentStreak > 0 ? C.success : C.textMuted }]}>
            {currentStreak} DAY{currentStreak !== 1 ? 'S' : ''}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{bestStreak}</Text>
            <Text style={styles.statLabel}>BEST STREAK</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{isTodayComplete ? 'COMPLETE' : 'PENDING'}</Text>
            <Text style={styles.statLabel}>TODAY</Text>
          </View>
        </View>

        {nextMilestone && (
          <View style={styles.milestoneSection}>
            <View style={styles.milestoneHeader}>
              <Text style={styles.milestoneLabel}>NEXT MILESTONE</Text>
              <Text style={styles.milestoneValue}>{nextMilestone} DAYS</Text>
            </View>
            <View style={styles.milestoneProgressTrack}>
              <View style={[styles.milestoneProgressFill, { width: `${progressToNextMilestone}%`, backgroundColor: C.cyan }]} />
            </View>
            <Text style={styles.milestoneProgressText}>{progressToNextMilestone}% COMPLETE</Text>
          </View>
        )}

        {newlyReachedMilestone && (
          <View style={styles.milestoneReached}>
            <Text style={styles.milestoneReachedText}>MILESTONE REACHED: {newlyReachedMilestone} DAYS</Text>
            <Text style={styles.milestoneRewardText}>REWARD GRANTED</Text>
          </View>
        )}

        <View style={styles.milestonesList}>
          {([3, 7, 14, 30] as const).map(m => (
            <View key={m} style={[styles.milestoneItem, m <= currentStreak && styles.milestoneCompleted]}>
              <Text style={[styles.milestoneDay, m <= currentStreak && styles.milestoneDayCompleted]}>{m} DAYS</Text>
              <Text style={styles.milestoneReward}>
                +{getMilestoneReward(m).realXp} XP / +{getMilestoneReward(m).energy} EN
              </Text>
              {m <= currentStreak && <Text style={styles.milestoneDone}>✓</Text>}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function getMilestoneReward(milestone: number) {
  const baseXp = 50;
  const baseEnergy = 5;
  const multiplier = Math.sqrt(milestone / 3);
  return {
    realXp: Math.round(baseXp * multiplier),
    energy: Math.round(baseEnergy * multiplier),
  };
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
  accentBar: {
    position: 'absolute',
    width: 4,
    top: 0,
    bottom: 0,
    left: 0,
  },
  content: {
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: C.cyan,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  currentStreak: {
    fontSize: 28,
    fontWeight: '900',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: C.white,
    fontSize: 22,
    fontWeight: '900',
  },
  statLabel: {
    color: C.textVeryMuted,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: C.line,
  },
  milestoneSection: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  milestoneLabel: {
    color: C.textVeryMuted,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  milestoneValue: {
    color: C.cyan,
    fontSize: 16,
    fontWeight: '900',
  },
  milestoneProgressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#09252C',
    overflow: 'hidden',
  },
  milestoneProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  milestoneProgressText: {
    color: C.cyan,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 8,
    textAlign: 'center',
  },
  milestoneReached: {
    backgroundColor: 'rgba(0,200,100,0.1)',
    borderWidth: 1,
    borderColor: C.success,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  milestoneReachedText: {
    color: C.success,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  milestoneRewardText: {
    color: C.textMuted,
    fontSize: 10,
    marginTop: 4,
  },
  milestonesList: {
    marginTop: 16,
    gap: 8,
  },
  milestoneItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 12,
    backgroundColor: '#061116',
  },
  milestoneCompleted: {
    borderColor: C.success,
    backgroundColor: 'rgba(0,200,100,0.05)',
  },
  milestoneDay: {
    color: C.textMuted,
    fontSize: 12,
    fontWeight: '900',
  },
  milestoneDayCompleted: {
    color: C.success,
  },
  milestoneReward: {
    color: C.cyan,
    fontSize: 10,
    fontWeight: '900',
  },
  milestoneDone: {
    color: C.success,
    fontSize: 14,
    fontWeight: '900',
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
  compactBar: {
    position: 'absolute',
    width: 3,
    top: 0,
    bottom: 0,
    left: 0,
  },
  compactContent: {
    flex: 1,
    gap: 4,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactLabel: {
    color: C.textVeryMuted,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  compactValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  compactProgressTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: '#09252C',
    overflow: 'hidden',
    marginTop: 4,
  },
  compactProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
});