import {
    StyleSheet,
    Text,
    View,
} from 'react-native';

import {
    PlayerProfile,
    SYSTEM_COLORS,
} from '../core';

import SystemAura from './SystemAura';
import XpBar from './XpBar';

type Props = {
  player: PlayerProfile;
};

export default function PlayerHero({
  player,
}: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.topLine}>
        <View>
          <Text style={styles.identity}>
            REAL IDENTITY
          </Text>

          <Text style={styles.status}>
            AWAKENING FORM // ACTIVE
          </Text>
        </View>

        <View style={styles.equalBadge}>
          <Text style={styles.equalBadgeText}>
            ORIGIN 0
          </Text>
        </View>
      </View>

      <View style={styles.middle}>
        <View style={styles.auraWrap}>
          <SystemAura size={205} />

          <Text style={styles.avatarLabel}>
            PLAYER CORE
          </Text>
        </View>

        <View style={styles.levelPanel}>
          <Text style={styles.rankHeader}>
            REAL RANK
          </Text>

          <View style={styles.levelRow}>
            <Text style={styles.levelPrefix}>
              LV.
            </Text>

            <Text style={styles.level}>
              {player.realLevel}
            </Text>
          </View>

          <View style={styles.rankBadge}>
            <Text style={styles.rank}>
              RANGA {player.rank}
            </Text>
          </View>

          <View style={styles.miniLine} />

          <Text style={styles.evolutionLabel}>
            EVOLUTION
          </Text>

          <Text style={styles.evolution}>
            STAGE {player.avatarEvolution}
          </Text>
        </View>
      </View>

      <Text style={styles.equalOrigin}>
        EQUAL ORIGIN // KAŻDY ZACZYNA OD TEGO
        SAMEGO PUNKTU
      </Text>

      <View style={styles.xp}>
        <XpBar
          value={player.realXp}
          max={player.realXpToNextLevel}
        />
      </View>

      <View style={styles.quickStats}>
        <View style={styles.quickItem}>
          <Text style={styles.quickValue}>
            {player.streak}
          </Text>
          <Text style={styles.quickLabel}>
            STREAK
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.quickItem}>
          <Text style={styles.quickValue}>
            {player.verifiedQuestCount}
          </Text>
          <Text style={styles.quickLabel}>
            VERIFIED
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.quickItem}>
          <Text style={styles.quickValue}>
            {player.gameEnergy}
          </Text>
          <Text style={styles.quickLabel}>
            ENERGY
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: SYSTEM_COLORS.line,
    backgroundColor: 'rgba(5,15,18,0.96)',
    overflow: 'hidden',
    padding: 18,
  },

  topLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  identity: {
    color: SYSTEM_COLORS.textMuted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 3,
  },

  status: {
    color: SYSTEM_COLORS.cyan,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginTop: 5,
  },

  equalBadge: {
    borderWidth: 1,
    borderColor: SYSTEM_COLORS.cyanDark,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  equalBadgeText: {
    color: SYSTEM_COLORS.cyan,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  middle: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 230,
  },

  auraWrap: {
    width: '59%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarLabel: {
    position: 'absolute',
    bottom: 17,
    color: SYSTEM_COLORS.textVeryMuted,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 2,
  },

  levelPanel: {
    flex: 1,
    alignItems: 'center',
  },

  rankHeader: {
    color: SYSTEM_COLORS.textVeryMuted,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 2.5,
  },

  levelRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 3,
  },

  levelPrefix: {
    color: SYSTEM_COLORS.cyan,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
    marginRight: 4,
  },

  level: {
    color: SYSTEM_COLORS.white,
    fontSize: 64,
    lineHeight: 67,
    fontWeight: '900',
  },

  rankBadge: {
    borderWidth: 1,
    borderColor: SYSTEM_COLORS.lineBright,
    borderRadius: 999,
    paddingHorizontal: 15,
    paddingVertical: 7,
  },

  rank: {
    color: SYSTEM_COLORS.cyan,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
  },

  miniLine: {
    width: 44,
    height: 1,
    backgroundColor: SYSTEM_COLORS.line,
    marginVertical: 13,
  },

  evolutionLabel: {
    color: SYSTEM_COLORS.textVeryMuted,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 2,
  },

  evolution: {
    color: SYSTEM_COLORS.text,
    fontSize: 9,
    fontWeight: '900',
    marginTop: 4,
  },

  equalOrigin: {
    color: SYSTEM_COLORS.textMuted,
    textAlign: 'center',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.4,
    lineHeight: 14,
  },

  xp: {
    marginTop: 20,
  },

  quickStats: {
    flexDirection: 'row',
    marginTop: 19,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: SYSTEM_COLORS.line,
  },

  quickItem: {
    flex: 1,
    alignItems: 'center',
  },

  quickValue: {
    color: SYSTEM_COLORS.white,
    fontSize: 20,
    fontWeight: '900',
  },

  quickLabel: {
    color: SYSTEM_COLORS.textVeryMuted,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginTop: 3,
  },

  divider: {
    width: 1,
    height: 30,
    alignSelf: 'center',
    backgroundColor: SYSTEM_COLORS.line,
  },
});