import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SYSTEM_COLORS as C } from '../core';
import type { Boss } from '../boss/domain';

interface BossCardProps {
  boss: Boss;
  onPress?: () => void;
  compact?: boolean;
}

export default function BossCard({ boss, onPress, compact = false }: BossCardProps) {
  const progress = buildBossProgressModel(boss);
  const isLocked = boss.status === 'LOCKED';
  const isDefeated = boss.status === 'DEFEATED';
  const isActive = boss.status === 'ACTIVE';

  const difficultyColors = {
    TIER_1: C.cyan,
    TIER_2: C.warning,
    TIER_3: C.danger,
    TIER_4: '#d4adff',
  };
  const difficultyColor = difficultyColors[boss.difficulty];

  if (compact) {
    return (
      <Pressable onPress={onPress} disabled={isLocked} style={({ pressed }) => [
        styles.compactCard,
        pressed && styles.compactCardPressed,
        isLocked && styles.compactCardLocked,
      ]}>
        <View style={[styles.compactBar, { backgroundColor: difficultyColor }]} />
        <View style={styles.compactContent}>
          <View style={styles.compactHeader}>
            <Text style={styles.compactName}>{boss.name}</Text>
            <Text style={[styles.compactStatus, { color: getStatusColor(boss.status) }]}>{boss.status}</Text>
          </View>
          <View style={styles.compactHp}>
            <Text style={styles.compactHpLabel}>HP</Text>
            <Text style={styles.compactHpValue}>{boss.currentHp} / {boss.maxHp}</Text>
          </View>
          <View style={styles.compactProgressTrack}>
            <View style={[styles.compactProgressFill, { width: `${progress.hpPercent}%`, backgroundColor: difficultyColor }]} />
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} disabled={isLocked} style={({ pressed }) => [
      styles.card,
      pressed && styles.cardPressed,
      isLocked && styles.cardLocked,
    ]}>
      <View style={[styles.accentBar, { backgroundColor: difficultyColor }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{boss.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(boss.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(boss.status) }]}>{boss.status}</Text>
          </View>
        </View>

        <Text style={styles.difficulty}>{boss.difficulty}</Text>

        <Text style={styles.description}>{boss.description}</Text>

        <View style={styles.hpRow}>
          <View style={styles.hpLabel}>
            <Text style={styles.hpLabelText}>HP</Text>
            <Text style={[styles.hpValue, { color: difficultyColor }]}>
              {boss.currentHp} / {boss.maxHp}
            </Text>
          </View>
          <View style={styles.hpProgressTrack}>
            <View style={[styles.hpProgressFill, { width: `${progress.hpPercent}%`, backgroundColor: difficultyColor }]} />
          </View>
        </View>

        <View style={styles.rewardRow}>
          <View style={styles.rewardItem}>
            <Text style={styles.rewardLabel}>REWARD</Text>
            <Text style={styles.rewardValue}>+{boss.rewardXp} REAL XP</Text>
          </View>
          <View style={styles.rewardItem}>
            <Text style={styles.rewardLabel}>ENERGY</Text>
            <Text style={styles.rewardValue}>+{boss.rewardEnergy} ENERGY</Text>
          </View>
        </View>

        {isLocked && boss.unlockCondition && (
          <Text style={styles.lockedText}>REQUIRES: {getUnlockText(boss.unlockCondition)}</Text>
        )}

        {isDefeated && boss.defeatedAt && (
          <Text style={styles.defeatedText}>DEFEATED · {formatDate(boss.defeatedAt)}</Text>
        )}
      </View>
    </Pressable>
  );
}

function buildBossProgressModel(boss: Boss) {
  const hpPercent = boss.maxHp > 0 ? Math.max(0, Math.min(100, (boss.currentHp / boss.maxHp) * 100)) : 0;
  return { hpPercent };
}

function getStatusColor(status: string) {
  switch (status) {
    case 'LOCKED': return C.danger;
    case 'AVAILABLE': return C.cyan;
    case 'ACTIVE': return C.success;
    case 'DEFEATED': return C.success;
    default: return C.textMuted;
  }
}

function getUnlockText(condition: string | null): string {
  switch (condition) {
    case 'AWAKENING_COMPLETE': return 'FIRST AWAKENING';
    case 'WORLD_LINK_COMPLETE': return 'WORLD LINK';
    case 'DAILY_CLEAR': return 'DAILY CLEAR';
    default: return condition ?? 'UNKNOWN';
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
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
  cardLocked: {
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
  difficulty: {
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
  hpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  hpLabel: {
    gap: 4,
  },
  hpLabelText: {
    color: C.textVeryMuted,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  hpValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  hpProgressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#09252C',
    overflow: 'hidden',
    marginLeft: 16,
  },
  hpProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  rewardItem: {
    flex: 1,
  },
  rewardLabel: {
    color: C.textVeryMuted,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1.3,
  },
  rewardValue: {
    color: C.cyan,
    fontSize: 12,
    fontWeight: '900',
    marginTop: 4,
  },
  lockedText: {
    color: C.danger,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 8,
  },
  defeatedText: {
    color: C.success,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 8,
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
  compactCardLocked: {
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
  compactHp: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  compactHpLabel: {
    color: C.textVeryMuted,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1,
  },
  compactHpValue: {
    color: C.white,
    fontSize: 12,
    fontWeight: '900',
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
});