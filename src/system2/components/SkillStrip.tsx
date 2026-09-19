import {
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import {
    PlayerStats,
    SKILL_KEYS,
    SKILL_META,
    SYSTEM_COLORS,
    getSkillProgressPercent,
} from '../core';

type Props = {
  stats: PlayerStats;
};

export default function SkillStrip({
  stats,
}: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.code}>
          7 REAL SKILLS
        </Text>

        <Text style={styles.hint}>
          BUILD
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {SKILL_KEYS.map((key) => {
          const skill = stats[key];

          return (
            <View
              style={styles.skill}
              key={key}
            >
              <Text style={styles.skillCode}>
                {key}
              </Text>

              <Text style={styles.skillLevel}>
                {skill.level}
              </Text>

              <Text
                style={styles.skillName}
                numberOfLines={1}
              >
                {SKILL_META[key].name}
              </Text>

              <View style={styles.bar}>
                <View style={[styles.barFill, { width: `${Math.max(1, getSkillProgressPercent(skill) * 100)}%` }]} />
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginTop: 14,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 9,
  },

  code: {
    color: SYSTEM_COLORS.cyan,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 2,
  },

  hint: {
    color: SYSTEM_COLORS.textVeryMuted,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 2,
  },

  content: {
    gap: 8,
    paddingRight: 18,
  },

  skill: {
    width: 92,
    height: 88,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SYSTEM_COLORS.line,
    backgroundColor: 'rgba(5,15,18,0.94)',
    padding: 10,
  },

  skillCode: {
    color: SYSTEM_COLORS.cyan,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  skillLevel: {
    color: SYSTEM_COLORS.white,
    fontSize: 25,
    fontWeight: '900',
    position: 'absolute',
    right: 9,
    top: 8,
  },

  skillName: {
    color: SYSTEM_COLORS.textMuted,
    fontSize: 7,
    fontWeight: '900',
    marginTop: 19,
  },

  bar: {
    height: 3,
    borderRadius: 999,
    backgroundColor: '#09252C',
    marginTop: 8,
    overflow: 'hidden',
  },

  barFill: {
    width: '4%',
    height: '100%',
    backgroundColor: SYSTEM_COLORS.cyan,
  },
});