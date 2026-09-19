import { Pressable, StyleSheet, Text, View, Animated } from 'react-native';
import { Share } from 'react-native';
import { SYSTEM_COLORS as C } from '../core';
import type { RunnableQuest } from '../quests/types';
import { DAILY_HF_CONFIG } from '../daily/config';
import { buildDailySharePayload, formatDailyShareText } from '../daily/share';
import type { PlayerProfile } from '../core/types';

interface DailyProgressCardHFProps {
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
    // High-frequency fields
    activeSlots: number;
    remainingCompletions: number;
    xpEarnedToday: number;
    xpBudget: number;
    completedCount: number;
    milestonesAchieved: number[];
    refillCount: number;
  } | null;
  completedQuestIds: readonly string[];
  activeQuestId: string | null;
  getQuest: (id: string) => RunnableQuest | undefined;
  onQuestPress: (questId: string) => void;
  playerProfile: PlayerProfile;
}

const ACTIVE_SLOTS = DAILY_HF_CONFIG.ACTIVE_SLOTS;
const MAX_COMPLETIONS = DAILY_HF_CONFIG.MAX_COMPLETIONS_PER_DAY;

export default function DailyProgressCardHF({
  daily,
  completedQuestIds,
  activeQuestId,
  getQuest,
  onQuestPress,
  playerProfile,
}: DailyProgressCardHFProps) {
  // HF Daily is always available (no longer gated by Awakening completion)
  const d = daily!;
  const availableQuests = d.questIds.map(id => getQuest(id)).filter(Boolean) as RunnableQuest[];
  const completedCount = d.completedCount;
  const progressPercent = MAX_COMPLETIONS > 0 ? completedCount / MAX_COMPLETIONS : 0;
  const slotProgress = d.activeSlots / ACTIVE_SLOTS;
  const xpBudgetPercent = d.xpBudget > 0 ? d.xpEarnedToday / d.xpBudget : 0;

  const nextMilestone = DAILY_HF_CONFIG.MILESTONES.find(m => m > completedCount) ?? null;
  const milestoneProgress = nextMilestone ? completedCount / nextMilestone : 1;

  const handleShare = async () => {
    const payload = buildDailySharePayload(
      playerProfile, {
        completedCount: completedCount,
        maxCompletions: MAX_COMPLETIONS,
        xpEarnedToday: d.xpEarnedToday,
        distanceMeters: playerProfile.totalDistanceMeters,
        sectorsDiscovered: playerProfile.discoveredSectors,
        discoveries: Math.floor(playerProfile.totalDistanceMeters / 1000),
        milestones: d.milestonesAchieved,
      });
    await Share.share({
      message: formatDailyShareText({ system: 'SYSTEM', reportType: 'DAILY_REPORT', timestamp: new Date().toISOString(), data: {
        completedQuests: completedCount,
        maxQuests: MAX_COMPLETIONS,
        level: playerProfile.realLevel,
        xpEarnedToday: d.xpEarnedToday,
        distanceKm: Math.round(playerProfile.totalDistanceMeters / 1000 * 10) / 10,
        sectorsDiscovered: playerProfile.discoveredSectors,
        discoveries: Math.floor(playerProfile.totalDistanceMeters / 1000),
        milestones: d.milestonesAchieved,
        streak: playerProfile.streak,
      }}),
      title: 'SYSTEM Daily Report',
    });
  };

  return (
    <View style={styles.panel}>
      <View style={styles.dailyHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>DAILY PROTOCOL · {completedCount}/{MAX_COMPLETIONS}</Text>
          {d.clockAnomaly && <Text style={styles.anomaly}>CLOCK ANOMALY</Text>}
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.xpBadge}>{d.xpEarnedToday} / {DAILY_HF_CONFIG.XP_BUDGET} XP</Text>
          <Pressable style={styles.shareBtn} onPress={handleShare} accessibilityLabel="Share progress">
            <Text style={styles.shareBtnText}>SHARE</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>DAILY PROGRESS</Text>
          <Text style={styles.progressValue}>{completedCount} / {MAX_COMPLETIONS}</Text>
        </View>
        <Animated.View style={[styles.progressTrack, { overflow: 'hidden' }]}>
          <Animated.View style={[styles.progressFill, { width: `${progressPercent * 100}%` }]} />
        </Animated.View>
        <Text style={styles.progressSub}>{Math.round(progressPercent * 100)}% COMPLETE</Text>
      </View>

      <View style={styles.slotsSection}>
        <Text style={styles.sectionLabel}>ACTIVE SLOTS · {d.activeSlots}/{ACTIVE_SLOTS}</Text>
        <View style={styles.slotsTrack}>
          {[...Array(ACTIVE_SLOTS)].map((_, i) => (
            <View key={i} style={[
              styles.slotDot,
              i < d.activeSlots ? styles.slotActive : styles.slotEmpty
            ]} />
          ))}
        </View>
        <Text style={styles.slotsMeta}>
          {d.activeSlots} ACTIVE · {d.remainingCompletions} REMAINING · {d.refillCount} REFILLS
        </Text>
      </View>

      <View style={styles.xpBudgetSection}>
        <View style={styles.xpBudgetRow}>
          <Text style={styles.xpBudgetLabel}>XP BUDGET</Text>
          <Text style={styles.xpBudgetValue}>{d.xpEarnedToday} / {d.xpBudget} XP</Text>
        </View>
        <Animated.View style={[styles.xpBudgetTrack, { overflow: 'hidden' }]}>
          <Animated.View style={[styles.xpBudgetFill, { width: `${xpBudgetPercent * 100}%` }]} />
        </Animated.View>
        <Text style={styles.xpBudgetSub}>{Math.round(xpBudgetPercent * 100)}% OF DAILY BUDGET</Text>
      </View>

      <View style={styles.milestonesSection}>
        <Text style={styles.sectionLabel}>MILESTONES</Text>
        <View style={styles.milestonesTrack}>
          {DAILY_HF_CONFIG.MILESTONES.map(m => (
<View key={m} style={[
                styles.milestoneDot,
                completedCount >= m ? styles.milestoneAchieved : styles.milestoneEmpty,
                nextMilestone === m ? styles.milestoneNext : null
              ]}>
              <Text style={[
                styles.milestoneNumber,
                completedCount >= m ? styles.milestoneNumberAchieved : null
              ]}>
                {m}
              </Text>
              {nextMilestone === m && (
                <Text style={styles.milestoneProgress}>
                  {completedCount}/{m}
                </Text>
              )}
            </View>
          ))}
        </View>
      </View>

      {d.milestonesAchieved.length > 0 && (
        <View style={styles.achievedMilestones}>
          <Text style={styles.achievedLabel}>ACHIEVED TODAY</Text>
          <View style={styles.achievedList}>
            {d.milestonesAchieved.map(m => (
              <Text key={m} style={styles.achievedItem}>MILESTONE {m} ✓</Text>
            ))}
          </View>
        </View>
      )}

      {d.clockAnomaly && (
        <Text style={styles.anomalyText}>
          CLOCK_ANOMALY — sprawdź datę telefonu. Zachowaliśmy Twój postęp.
        </Text>
      )}

      <View style={styles.questsHeader}>
        <Text style={styles.questsTitle}>ACTIVE QUESTS · {d.questIds.length}/{ACTIVE_SLOTS}</Text>
      </View>

      {d.questIds.map(qId => {
        const q = getQuest(qId);
        if (!q) return null;
        const done = completedQuestIds.includes(qId);
        const isActive = activeQuestId === qId;
        const isSuspicious = d.suspiciousQuestIds.includes(qId);
        const status: 'COMPLETED' | 'ACTIVE' | 'SUSPICIOUS' | 'AVAILABLE' | 'LOCKED' = done
          ? 'COMPLETED'
          : isActive
            ? 'ACTIVE'
            : isSuspicious
              ? 'SUSPICIOUS'
              : d.clockAnomaly
                ? 'LOCKED'
                : 'AVAILABLE';

        return (
          <Pressable
            key={qId}
            onPress={() => onQuestPress(qId)}
            disabled={d.clockAnomaly || status === 'LOCKED'}
            accessibilityRole="button"
            accessibilityLabel={`${q.title} — ${status}`}
            accessibilityState={{ disabled: d.clockAnomaly || status === 'LOCKED' }}
            style={({ pressed }) => [
              styles.questRow,
              pressed && styles.questRowPressed,
              (d.clockAnomaly || status === 'LOCKED') && styles.questRowDisabled,
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
        <Text style={styles.sectionLabel}>WEEKLY PROTOCOL · {Math.min(5, d.weeklyCompleted)}/5</Text>
        <View style={styles.weeklyProgressTrack}>
          <View style={[styles.weeklyProgressFill, { width: `${Math.min(100, (d.weeklyCompleted / 5) * 100)}%` }]} />
        </View>
        <Text style={styles.weeklyMeta}>
          {d.weeklyClear
            ? 'WEEKLY COMPLETE'
            : `5 Daily activities · +${150} REAL XP / +${15} ENERGY`}
          · {d.weekKey}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    padding: 20,
    marginTop: 16,
    backgroundColor: '#061116',
    borderWidth: 1,
    borderColor: '#1a3a44',
    borderRadius: 20,
  },
  dailyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: { flex: 1 },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#62efff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  xpBadge: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    backgroundColor: '#09252C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  shareBtn: {
    backgroundColor: '#09252C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1a3a44',
  },
  shareBtnText: {
    color: '#62efff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  anomaly: {
    color: '#ff4444',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    backgroundColor: 'rgba(255,68,68,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  progressSection: { marginBottom: 16 },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    color: '#62efff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  progressValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#09252C',
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#62efff',
  },
  progressSub: {
    color: '#62efff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },
  slotsSection: { marginBottom: 16 },
  sectionLabel: {
    color: '#62efff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  slotsTrack: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  slotDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#09252C',
    borderWidth: 1,
    borderColor: '#1a3a44',
  },
  slotActive: {
    backgroundColor: '#62efff',
    borderColor: '#62efff',
  },
  slotEmpty: {
    backgroundColor: '#09252C',
  },
  slotsMeta: {
    color: '#91a5b2',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },
  xpBudgetSection: { marginBottom: 16 },
  xpBudgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  xpBudgetLabel: {
    color: '#62efff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  xpBudgetValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  xpBudgetTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#09252C',
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 4,
  },
  xpBudgetFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#62efff',
  },
  xpBudgetSub: {
    color: '#62efff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },
  milestonesSection: { marginBottom: 16 },
  milestonesTrack: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  milestoneDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#09252C',
    borderWidth: 2,
    borderColor: '#1a3a44',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  milestoneAchieved: {
    backgroundColor: '#62efff',
    borderColor: '#62efff',
  },
  milestoneNext: {
    borderColor: '#ffb400',
    borderWidth: 3,
  },
  milestoneNumber: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
  },
  milestoneNumberAchieved: {
    color: '#030709',
  },
  milestoneProgress: {
    color: '#ffb400',
    fontSize: 7,
    fontWeight: '900',
    marginTop: -4,
  },
  achievedMilestones: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1a3a44',
  },
  achievedLabel: {
    color: '#62efff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  achievedList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  achievedItem: {
    color: '#62efff',
    fontSize: 10,
    fontWeight: '900',
    backgroundColor: 'rgba(0,229,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  emptyBody: {
    color: '#91a5b2',
    fontSize: 13,
    lineHeight: 21,
    marginTop: 12,
  },
  questsHeader: {
    marginTop: 16,
    marginBottom: 12,
  },
  questsTitle: {
    color: '#62efff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  anomalyText: {
    color: '#ff4444',
    fontSize: 11,
    lineHeight: 18,
    marginBottom: 12,
  },
  milestoneEmpty: {
    backgroundColor: '#09252C',
    borderColor: '#1a3a44',
  },
  questRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a44',
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
    backgroundColor: '#91a5b2',
  },
  statusCompleted: { backgroundColor: '#00e5ff' },
  statusActive: { backgroundColor: '#62efff' },
  statusSuspicious: { backgroundColor: '#ffb400' },
  statusAvailable: { backgroundColor: '#62efff' },
  questTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
    flex: 1,
  },
  questCompleted: {
    textDecorationLine: 'line-through',
    color: '#91a5b2',
  },
  questStatus: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  statusCompletedText: { color: '#00e5ff' },
  statusActiveText: { color: '#62efff' },
  statusSuspiciousText: { color: '#ffb400' },
  statusAvailableText: { color: '#62efff' },
  statusLockedText: { color: '#ff4444' },
  questMeta: {
    color: '#91a5b2',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  weeklySection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1a3a44',
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
    backgroundColor: '#00e5ff',
  },
  weeklyMeta: {
    color: '#91a5b2',
    fontSize: 10,
    lineHeight: 16,
  },
  devMarker: {
    padding: 8,
    backgroundColor: '#ffb400',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#ff8800',
  },
  devMarkerText: {
    color: '#030709',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
});