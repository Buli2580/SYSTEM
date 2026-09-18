import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SYSTEM_COLORS as C } from '../core';
import type { RunnableQuest } from '../quests/types';

interface DailyProgressCardProps {
  daily: {
    dayKey: string;
    questIds: string[];
    completed: number;
    weeklyCompleted: number;
    clear: boolean;
    weeklyClear: boolean;
    clockAnomaly: boolean;
    suspiciousQuestIds: string[];
    weekKey: string;
  } | null;
  completedQuestIds: readonly string[];
  activeQuestId: string | null;
  getQuest: (id: string) => RunnableQuest | undefined;
  onQuestPress: (questId: string) => void;
}

const DAILY_RULES = {
  slots: 3,
  clearXp: 75,
  clearEnergy: 10,
  weeklyTarget: 5,
  weeklyXp: 150,
  weeklyEnergy: 15,
} as const;

export default function DailyProgressCard({
  daily,
  completedQuestIds,
  activeQuestId,
  getQuest,
  onQuestPress,
}: DailyProgressCardProps) {
  if (!daily) {
    return (
      <View style={styles.panel}>
        <Text style={styles.title}>DAILY PROTOCOL</Text>
        <Text style={styles.body}>Complete Awakening to unlock Daily Protocol.</Text>
      </View>
    );
  }

  const availableQuests = daily.questIds.map(id => getQuest(id)).filter(Boolean) as RunnableQuest[];
  const completedCount = daily.completed;
  const totalCount = availableQuests.length;
  const progressPercent = totalCount > 0 ? completedCount / totalCount : 0;

  return (
    <View style={styles.panel}>
      <View style={styles.dailyHeader}>
        <Text style={styles.title}>DAILY PROTOCOL · {completedCount}/{totalCount}</Text>
        {daily.clockAnomaly && <Text style={styles.anomaly}>CLOCK ANOMALY</Text>}
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPercent * 100}%` }]} />
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>DAILY XP</Text>
          <Text style={styles.metaValue}>
            {daily.clear ? DAILY_RULES.clearXp : availableQuests.reduce((sum, q) => sum + q.rewards.realXp, 0)} REAL XP
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>ENERGY</Text>
          <Text style={styles.metaValue}>
            {daily.clear ? DAILY_RULES.clearEnergy : availableQuests.reduce((sum, q) => sum + (q.rewards.gameEnergy ?? 0), 0)} ENERGY
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>CLEAR BONUS</Text>
          <Text style={[
            styles.metaValue,
            daily.clear ? { color: C.success } : { color: C.cyan }
          ]}>
            {daily.clear ? 'CLAIMED' : `+${DAILY_RULES.clearXp} XP / +${DAILY_RULES.clearEnergy} EN`}
          </Text>
        </View>
      </View>

      {daily.clockAnomaly && (
        <Text style={styles.anomalyText}>
          CLOCK_ANOMALY — sprawdź datę telefonu. Zachowaliśmy Twój postęp.
        </Text>
      )}

      {availableQuests.map(q => {
        const done = completedQuestIds.includes(q.id);
        const isActive = activeQuestId === q.id;
        const isSuspicious = daily.suspiciousQuestIds.includes(q.id);
        const status: 'COMPLETED' | 'ACTIVE' | 'SUSPICIOUS' | 'AVAILABLE' | 'LOCKED' = done
          ? 'COMPLETED'
          : isActive
            ? 'ACTIVE'
            : isSuspicious
              ? 'SUSPICIOUS'
              : daily.clockAnomaly
                ? 'LOCKED'
                : 'AVAILABLE';

        return (
          <Pressable
            key={q.id}
            onPress={() => onQuestPress(q.id)}
            disabled={daily.clockAnomaly || status === 'LOCKED'}
            accessibilityRole="button"
            accessibilityLabel={`${q.title} — ${status}`}
            accessibilityState={{ disabled: daily.clockAnomaly || status === 'LOCKED' }}
            style={({ pressed }) => [
              styles.questRow,
              pressed && styles.questRowPressed,
              (daily.clockAnomaly || status === 'LOCKED') && styles.questRowDisabled,
            ]}
          >
            <View style={styles.questRowLeft}>
              <View style={[
                styles.statusDot,
                status === 'COMPLETED' && styles.statusCompleted,
                status === 'ACTIVE' && styles.statusActive,
                status === 'SUSPICIOUS' && styles.statusSuspicious,
                status === 'AVAILABLE' && styles.statusAvailable,
              ]} />
              <Text style={[
                styles.questTitle,
                done && styles.questCompleted,
              ]}>
                {q.title}
              </Text>
            </View>

            <View style={styles.questRowRight}>
              <Text style={[
                styles.questStatus,
                status === 'COMPLETED' && styles.statusCompletedText,
                status === 'ACTIVE' && styles.statusActiveText,
                status === 'SUSPICIOUS' && styles.statusSuspiciousText,
                status === 'AVAILABLE' && styles.statusAvailableText,
                status === 'LOCKED' && styles.statusLockedText,
              ]}>
                {status}
              </Text>
              <Text style={styles.questMeta}>
                {q.verification.type}{q.activityType ? ` + ${q.activityType}` : ''}
              </Text>
            </View>
          </Pressable>
        );
      })}

      <View style={styles.weeklySection}>
        <View style={styles.weeklyHeader}>
          <Text style={styles.weeklyTitle}>
            WEEKLY PROTOCOL · {Math.min(DAILY_RULES.weeklyTarget, daily.weeklyCompleted)}/{DAILY_RULES.weeklyTarget}
          </Text>
          {daily.weeklyClear && <Text style={styles.weeklyComplete}>WEEKLY COMPLETE</Text>}
        </View>
        <View style={styles.weeklyProgressTrack}>
          <View style={[styles.weeklyProgressFill, { width: `${Math.min(100, (daily.weeklyCompleted / DAILY_RULES.weeklyTarget) * 100)}%` }]} />
        </View>
        <Text style={styles.weeklyMeta}>
          {daily.weeklyClear
            ? 'WEEKLY COMPLETE'
            : `${DAILY_RULES.weeklyTarget} Daily activities · +${DAILY_RULES.weeklyXp} REAL XP / +${DAILY_RULES.weeklyEnergy} ENERGY`}
          · {daily.weekKey}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    padding: 20,
    marginTop: 16,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 20,
  },

  body: {
    color: C.textMuted,
    fontSize: 13,
    lineHeight: 21,
    marginTop: 12,
  },

  dailyHeader: {
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

  anomaly: {
    color: C.danger,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    backgroundColor: 'rgba(255,68,68,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },

  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#09252C',
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 16,
  },

  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: C.cyan,
  },

  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },

  metaItem: {
    flex: 1,
    minWidth: 80,
  },

  metaLabel: {
    color: C.textVeryMuted,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1.3,
  },

  metaValue: {
    color: C.white,
    fontSize: 11,
    fontWeight: '900',
    marginTop: 4,
  },

  anomalyText: {
    color: C.danger,
    fontSize: 11,
    lineHeight: 18,
    marginBottom: 12,
  },

  questRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },

  questRowPressed: {
    backgroundColor: 'rgba(0,229,255,0.04)',
  },

  questRowDisabled: {
    opacity: 0.5,
  },

  questRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },

  questRowRight: {
    alignItems: 'flex-end',
    gap: 2,
  },

  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: C.textVeryMuted,
  },

  statusCompleted: {
    backgroundColor: C.success,
  },

  statusActive: {
    backgroundColor: C.cyan,
  },

  statusSuspicious: {
    backgroundColor: C.warning,
  },

  statusAvailable: {
    backgroundColor: C.cyanDark,
  },

  questTitle: {
    color: C.white,
    fontSize: 13,
    fontWeight: '900',
    flex: 1,
  },

  questCompleted: {
    textDecorationLine: 'line-through',
    color: C.textMuted,
  },

  questStatus: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  statusCompletedText: {
    color: C.success,
  },

  statusActiveText: {
    color: C.cyan,
  },

  statusSuspiciousText: {
    color: C.warning,
  },

  statusAvailableText: {
    color: C.cyan,
  },

  statusLockedText: {
    color: C.danger,
  },

  questMeta: {
    color: C.textVeryMuted,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  weeklySection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },

  weeklyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  weeklyTitle: {
    color: C.cyan,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  weeklyComplete: {
    color: C.success,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  weeklyProgressTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: '#09252C',
    overflow: 'hidden',
    marginBottom: 8,
  },

  weeklyProgressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: C.success,
  },

  weeklyMeta: {
    color: C.textMuted,
    fontSize: 10,
    lineHeight: 16,
  },
});