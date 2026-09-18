import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SYSTEM_COLORS as C } from '../core';
import { getPlayerProgressPercent } from '../core/progression';
import type { PlayerProfile } from '../core/types';
import type { RewardReceipt } from '../core/rewards';
import SkillStrip from './SkillStrip';

let XpBar: React.ComponentType<{ value: number; max: number }> | null = null;
const loadXpBar = async () => {
  if (!XpBar) {
    try {
      const mod = await import('./XpBar');
      XpBar = mod.default;
    } catch {
      XpBar = null;
    }
  }
  return XpBar;
};

interface ProgressionDashboardProps {
  player: PlayerProfile;
  lastReward?: RewardReceipt | null;
}

export default function ProgressionDashboard({ player, lastReward }: ProgressionDashboardProps) {
  const [XpBarComponent, setXpBarComponent] = useState<React.ComponentType<{ value: number; max: number }> | null>(null);

  useEffect(() => {
    loadXpBar().then(setXpBarComponent);
  }, []);

  const renderXpBar = () => {
    if (!XpBarComponent) return <View style={styles.xpPlaceholder} />;
    return <XpBarComponent value={player.realXp} max={player.realXpToNextLevel} />;
  };

  return (
    <View style={styles.panel}>

      <View style={styles.levelRow}>
        <View style={styles.levelInfo}>
          <Text style={styles.levelLabel}>REAL LEVEL</Text>
          <Text style={styles.levelValue}>{player.realLevel}</Text>
        </View>

        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>RANK {player.rank}</Text>
        </View>

        <View style={styles.evoInfo}>
          <Text style={styles.levelLabel}>EVOLUTION</Text>
          <Text style={styles.levelValue}>STAGE {player.avatarEvolution}</Text>
        </View>
      </View>

      {renderXpBar()}

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{player.totalRealXp.toLocaleString()}</Text>
          <Text style={styles.statLabel}>TOTAL REAL XP</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{player.verifiedQuestCount}</Text>
          <Text style={styles.statLabel}>VERIFIED QUESTS</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{player.streak}</Text>
          <Text style={styles.statLabel}>STREAK</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{player.gameEnergy}</Text>
          <Text style={styles.statLabel}>ENERGY</Text>
        </View>
      </View>

      {lastReward && (
        <View style={styles.lastReward}>
          <Text style={styles.rewardTitle}>LAST REWARD</Text>
          <View style={styles.rewardRow}>
            <Text style={[styles.rewardItem, { color: C.cyan }]}>+{lastReward.realXp} REAL XP</Text>
            {Object.entries(lastReward.skillXp).map(([skill, xp]) => (
              <Text key={skill} style={styles.rewardItem}>+{xp} {skill} XP</Text>
            ))}
            <Text style={[styles.rewardItem, { color: C.success }]}>+{lastReward.energy} ENERGY</Text>
          </View>
          {lastReward.skillLevels && lastReward.skillLevels.length > 0 && (
            <View style={styles.skillLevelUps}>
              {lastReward.skillLevels.map(s => (
                <Text key={s.key} style={styles.skillLevelUp}>
                  {s.key} LV.{s.before} → LV.{s.after}
                </Text>
              ))}
            </View>
          )}
          {lastReward.afterLevel > lastReward.beforeLevel && (
            <Text style={styles.levelUp}>
              REAL LEVEL {lastReward.beforeLevel} → {lastReward.afterLevel}
            </Text>
          )}
        </View>
      )}

      <SkillStrip stats={player.stats} />
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

  sectionTitle: {
    color: C.cyan,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 16,
  },

  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  levelInfo: {
    alignItems: 'flex-start',
  },

  levelLabel: {
    color: C.textVeryMuted,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  levelValue: {
    color: C.white,
    fontSize: 36,
    fontWeight: '900',
    lineHeight: 40,
  },

  rankBadge: {
    borderWidth: 1,
    borderColor: C.lineBright,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignSelf: 'flex-end',
  },

  rankText: {
    color: C.cyan,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  evoInfo: {
    alignItems: 'flex-end',
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
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
    marginTop: 3,
  },

  divider: {
    width: 1,
    height: 30,
    backgroundColor: C.line,
    alignSelf: 'center',
  },

  lastReward: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },

  rewardTitle: {
    color: C.success,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 10,
  },

  rewardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  rewardItem: {
    color: C.white,
    fontSize: 11,
    fontWeight: '900',
  },

  skillLevelUps: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },

  skillLevelUp: {
    color: C.success,
    fontSize: 10,
    fontWeight: '900',
    backgroundColor: 'rgba(0,200,100,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },

  levelUp: {
    color: C.cyan,
    fontSize: 11,
    fontWeight: '900',
    marginTop: 10,
  },

  xpPlaceholder: {
    height: 20,
    backgroundColor: '#09252C',
    borderRadius: 999,
    marginTop: 8,
  },
});