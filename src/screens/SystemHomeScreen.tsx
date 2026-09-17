import { useEffect } from 'react';
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import Animated, {
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

import {
    INITIAL_PLAYER,
    SKILLS,
    SkillDefinition,
} from '../game/core';

import {
    SYSTEM_COLORS as C,
    SYSTEM_RADIUS as R,
    SYSTEM_SPACING as S,
} from '../theme/systemTheme';

function SkillCard({
  skill,
  index,
}: {
  skill: SkillDefinition;
  index: number;
}) {
  const state = INITIAL_PLAYER.skills[skill.key];

  return (
    <Animated.View
      entering={FadeInDown.delay(280 + index * 55).duration(500)}
      style={styles.skillCard}
    >
      <View style={styles.skillTop}>
        <Text style={styles.skillGlyph}>{skill.glyph}</Text>

        <View style={styles.skillLevelBadge}>
          <Text style={styles.skillLevelSmall}>LV</Text>
          <Text style={styles.skillLevelNumber}>{state.level}</Text>
        </View>
      </View>

      <Text style={styles.skillCode}>{skill.key}</Text>
      <Text style={styles.skillName}>{skill.name}</Text>

      <View style={styles.smallXpTrack}>
        <View
          style={[
            styles.smallXpFill,
            {
              width: `${Math.min(
                100,
                (state.xp / state.nextLevelXp) * 100
              )}%`,
            },
          ]}
        />
      </View>

      <Text style={styles.skillXp}>
        {state.xp} / {state.nextLevelXp} XP
      </Text>
    </Animated.View>
  );
}

export default function SystemHomeScreen() {
  const auraScale = useSharedValue(0.94);
  const auraOpacity = useSharedValue(0.28);

  useEffect(() => {
    auraScale.value = withRepeat(
      withTiming(1.08, { duration: 2100 }),
      -1,
      true
    );

    auraOpacity.value = withRepeat(
      withTiming(0.58, { duration: 2100 }),
      -1,
      true
    );
  }, [auraOpacity, auraScale]);

  const auraStyle = useAnimatedStyle(() => ({
    opacity: auraOpacity.value,
    transform: [{ scale: auraScale.value }],
  }));

  const player = INITIAL_PLAYER;

  const xpPercent =
    (player.xp / player.nextLevelXp) * 100;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.backgroundOrbOne} />
      <View style={styles.backgroundOrbTwo} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInUp.duration(650)}
          style={styles.topBar}
        >
          <View>
            <Text style={styles.systemMicro}>
              SYSTEM // ONLINE
            </Text>

            <Text style={styles.welcome}>
              AWAKENING
            </Text>
          </View>

          <Pressable style={styles.notificationButton}>
            <Text style={styles.notificationGlyph}>◈</Text>
          </Pressable>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(80).duration(650)}
          style={styles.hero}
        >
          <Animated.View
            pointerEvents="none"
            style={[styles.aura, auraStyle]}
          />

          <View style={styles.characterCore}>
            <View style={styles.characterInner}>
              <Text style={styles.characterGlyph}>◇</Text>
            </View>
          </View>

          <Text style={styles.rankOverline}>
            REAL RANK
          </Text>

          <View style={styles.levelRow}>
            <Text style={styles.levelPrefix}>LV.</Text>
            <Text style={styles.levelNumber}>
              {player.realLevel}
            </Text>
          </View>

          <View style={styles.rankBadge}>
            <Text style={styles.rankBadgeLabel}>
              RANGA {player.rank}
            </Text>
          </View>

          <Text style={styles.equalOrigin}>
            EQUAL ORIGIN // KAŻDY ZACZYNA OD ZERA
          </Text>

          <View style={styles.xpBlock}>
            <View style={styles.xpHeader}>
              <Text style={styles.xpLabel}>REAL XP</Text>

              <Text style={styles.xpNumbers}>
                {player.xp} / {player.nextLevelXp}
              </Text>
            </View>

            <View style={styles.xpTrack}>
              <View
                style={[
                  styles.xpFill,
                  {
                    width: `${Math.max(
                      2,
                      Math.min(100, xpPercent)
                    )}%`,
                  },
                ]}
              />
            </View>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(170).duration(550)}
          style={styles.statusRow}
        >
          <View style={styles.statusCell}>
            <Text style={styles.statusValue}>
              {player.streak}
            </Text>
            <Text style={styles.statusLabel}>
              STREAK
            </Text>
          </View>

          <View style={styles.statusDivider} />

          <View style={styles.statusCell}>
            <Text style={styles.statusValue}>
              {player.verifiedQuests}
            </Text>
            <Text style={styles.statusLabel}>
              VERIFIED
            </Text>
          </View>

          <View style={styles.statusDivider} />

          <View style={styles.statusCell}>
            <Text style={styles.statusValue}>7</Text>
            <Text style={styles.statusLabel}>
              SKILLS
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(220).duration(550)}
          style={styles.sectionHeader}
        >
          <View>
            <Text style={styles.sectionMicro}>
              ACTIVE OBJECTIVE
            </Text>
            <Text style={styles.sectionTitle}>
              GŁÓWNA MISJA
            </Text>
          </View>

          <Text style={styles.chapter}>01</Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(250).duration(550)}
          style={styles.mainQuest}
        >
          <View style={styles.questAccent} />

          <View style={styles.questContent}>
            <Text style={styles.questType}>
              MAIN QUEST
            </Text>

            <Text style={styles.questTitle}>
              PIERWSZE PRZEBUDZENIE
            </Text>

            <Text style={styles.questDescription}>
              Ukończ 3 prawdziwe, zweryfikowane misje
              i rozpocznij historię swojej postaci.
            </Text>

            <View style={styles.questProgressRow}>
              <Text style={styles.questProgressText}>
                POSTĘP
              </Text>

              <Text style={styles.questProgressValue}>
                0 / 3
              </Text>
            </View>

            <View style={styles.questTrack}>
              <View style={styles.questFill} />
            </View>

            <View style={styles.rewardRow}>
              <View style={styles.rewardChip}>
                <Text style={styles.rewardText}>
                  +100 REAL XP
                </Text>
              </View>

              <View style={styles.rewardChip}>
                <Text style={styles.rewardText}>
                  AWAKENING KEY
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionMicro}>
              CHARACTER CORE
            </Text>
            <Text style={styles.sectionTitle}>
              7 SKILLÓW
            </Text>
          </View>

          <Text style={styles.sectionHint}>
            ALL LV.1
          </Text>
        </View>

        <View style={styles.skillsGrid}>
          {SKILLS.map((skill, index) => (
            <SkillCard
              key={skill.key}
              skill={skill}
              index={index}
            />
          ))}
        </View>

        <Animated.View
          entering={FadeInDown.delay(750).duration(600)}
          style={styles.gateCard}
        >
          <View style={styles.gateGlow} />

          <Text style={styles.gateMicro}>
            WORLD SCAN
          </Text>

          <Text style={styles.gateTitle}>
            BRAK AKTYWNEJ BRAMY
          </Text>

          <Text style={styles.gateDescription}>
            Exploration Engine będzie skanował otoczenie
            i tworzył prawdziwe misje GPS.
          </Text>

          <Pressable style={styles.gateButton}>
            <Text style={styles.gateButtonText}>
              ŚWIAT // WKRÓTCE
            </Text>
          </Pressable>
        </Animated.View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      <View style={styles.bottomNavigation}>
        <Pressable style={styles.navItemActive}>
          <Text style={styles.navGlyphActive}>◆</Text>
          <Text style={styles.navTextActive}>
            SYSTEM
          </Text>
        </Pressable>

        <Pressable style={styles.navItem}>
          <Text style={styles.navGlyph}>◇</Text>
          <Text style={styles.navText}>
            QUESTY
          </Text>
        </Pressable>

        <Pressable style={styles.navItem}>
          <Text style={styles.navGlyph}>◈</Text>
          <Text style={styles.navText}>
            POSTAĆ
          </Text>
        </Pressable>

        <Pressable style={styles.navItem}>
          <Text style={styles.navGlyph}>◎</Text>
          <Text style={styles.navText}>
            ŚWIAT
          </Text>
        </Pressable>

        <Pressable style={styles.navItem}>
          <Text style={styles.navGlyph}>•••</Text>
          <Text style={styles.navText}>
            WIĘCEJ
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.background,
  },

  container: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 14,
  },

  backgroundOrbOne: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: '#003944',
    opacity: 0.24,
    top: -100,
    right: -110,
  },

  backgroundOrbTwo: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: '#001D23',
    opacity: 0.6,
    top: 330,
    left: -140,
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: S.lg,
  },

  systemMicro: {
    color: C.cyan,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.3,
  },

  welcome: {
    color: C.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginTop: 3,
  },

  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.border,
  },

  notificationGlyph: {
    color: C.cyan,
    fontSize: 19,
  },

  hero: {
    minHeight: 390,
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.panelGlass,
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 30,
    overflow: 'hidden',
  },

  aura: {
    position: 'absolute',
    top: 35,
    width: 230,
    height: 230,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: C.cyan,
    backgroundColor: '#003743',
  },

  characterCore: {
    width: 170,
    height: 170,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.cyanSoft,
    backgroundColor: '#06161B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  characterInner: {
    width: 116,
    height: 116,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#020607',
    borderWidth: 1,
    borderColor: C.borderBright,
  },

  characterGlyph: {
    fontSize: 72,
    color: C.cyan,
    fontWeight: '200',
  },

  rankOverline: {
    color: C.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2.2,
  },

  levelRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 4,
  },

  levelPrefix: {
    color: C.cyan,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 8,
    marginRight: 4,
  },

  levelNumber: {
    color: C.text,
    fontSize: 58,
    lineHeight: 62,
    fontWeight: '900',
  },

  rankBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: C.cyanDark,
    backgroundColor: '#061B20',
    borderRadius: 999,
    marginTop: 4,
  },

  rankBadgeLabel: {
    color: C.cyan,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.8,
  },

  equalOrigin: {
    color: C.textMuted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginTop: 13,
  },

  xpBlock: {
    width: '100%',
    marginTop: 22,
  },

  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 7,
  },

  xpLabel: {
    color: C.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
  },

  xpNumbers: {
    color: C.cyan,
    fontSize: 10,
    fontWeight: '900',
  },

  xpTrack: {
    height: 6,
    borderRadius: 99,
    overflow: 'hidden',
    backgroundColor: '#0B2027',
  },

  xpFill: {
    height: '100%',
    backgroundColor: C.cyan,
    borderRadius: 99,
  },

  statusRow: {
    flexDirection: 'row',
    marginTop: 12,
    paddingVertical: 15,
    backgroundColor: C.panel,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
  },

  statusCell: {
    flex: 1,
    alignItems: 'center',
  },

  statusDivider: {
    width: 1,
    backgroundColor: C.border,
  },

  statusValue: {
    color: C.text,
    fontSize: 19,
    fontWeight: '900',
  },

  statusLabel: {
    color: C.textMuted,
    fontSize: 8,
    letterSpacing: 1.3,
    marginTop: 3,
    fontWeight: '800',
  },

  sectionHeader: {
    marginTop: 28,
    marginBottom: 11,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },

  sectionMicro: {
    color: C.cyanSoft,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 2,
  },

  sectionTitle: {
    color: C.text,
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 4,
  },

  chapter: {
    color: C.textDark,
    fontSize: 30,
    fontWeight: '900',
  },

  sectionHint: {
    color: C.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },

  mainQuest: {
    flexDirection: 'row',
    backgroundColor: C.panelStrong,
    borderRadius: R.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
  },

  questAccent: {
    width: 4,
    backgroundColor: C.cyan,
  },

  questContent: {
    flex: 1,
    padding: 18,
  },

  questType: {
    color: C.cyan,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.8,
  },

  questTitle: {
    color: C.text,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 7,
  },

  questDescription: {
    color: C.textMuted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 8,
  },

  questProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },

  questProgressText: {
    color: C.textMuted,
    fontSize: 9,
    fontWeight: '800',
  },

  questProgressValue: {
    color: C.cyan,
    fontSize: 10,
    fontWeight: '900',
  },

  questTrack: {
    height: 5,
    backgroundColor: '#10242A',
    borderRadius: 99,
    overflow: 'hidden',
    marginTop: 6,
  },

  questFill: {
    width: '2%',
    height: '100%',
    backgroundColor: C.cyan,
  },

  rewardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 16,
  },

  rewardChip: {
    borderRadius: 999,
    backgroundColor: '#071D22',
    borderWidth: 1,
    borderColor: C.cyanDark,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  rewardText: {
    color: C.cyanSoft,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },

  skillCard: {
    width: '48.6%',
    minHeight: 147,
    padding: 14,
    borderRadius: R.md,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.border,
  },

  skillTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  skillGlyph: {
    color: C.cyan,
    fontSize: 23,
  },

  skillLevelBadge: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },

  skillLevelSmall: {
    color: C.textMuted,
    fontSize: 7,
    fontWeight: '900',
    marginBottom: 2,
  },

  skillLevelNumber: {
    color: C.text,
    fontSize: 16,
    fontWeight: '900',
  },

  skillCode: {
    color: C.cyan,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginTop: 11,
  },

  skillName: {
    color: C.text,
    fontSize: 12,
    fontWeight: '900',
    marginTop: 2,
  },

  smallXpTrack: {
    height: 3,
    backgroundColor: '#102127',
    borderRadius: 99,
    marginTop: 14,
    overflow: 'hidden',
  },

  smallXpFill: {
    height: '100%',
    backgroundColor: C.cyan,
  },

  skillXp: {
    marginTop: 5,
    color: C.textMuted,
    fontSize: 8,
    fontWeight: '700',
  },

  gateCard: {
    marginTop: 28,
    minHeight: 210,
    backgroundColor: '#050B0E',
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: '#20343B',
    padding: 22,
    overflow: 'hidden',
  },

  gateGlow: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 999,
    backgroundColor: '#063A46',
    opacity: 0.25,
    right: -65,
    top: -70,
  },

  gateMicro: {
    color: C.cyan,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
  },

  gateTitle: {
    color: C.text,
    fontSize: 21,
    fontWeight: '900',
    marginTop: 10,
  },

  gateDescription: {
    color: C.textMuted,
    maxWidth: '85%',
    lineHeight: 19,
    marginTop: 8,
    fontSize: 12,
  },

  gateButton: {
    alignSelf: 'flex-start',
    marginTop: 18,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.cyanDark,
    backgroundColor: '#07171C',
  },

  gateButtonText: {
    color: C.cyan,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  bottomSpace: {
    height: 115,
  },

  bottomNavigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,

    height: 82,
    paddingTop: 9,

    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',

    backgroundColor: '#04090C',
    borderTopWidth: 1,
    borderTopColor: C.border,
  },

  navItem: {
    width: '20%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  navItemActive: {
    width: '20%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  navGlyph: {
    color: C.textDark,
    fontSize: 17,
    height: 22,
  },

  navGlyphActive: {
    color: C.cyan,
    fontSize: 18,
    height: 22,
  },

  navText: {
    color: C.textMuted,
    fontSize: 8,
    fontWeight: '800',
    marginTop: 4,
  },

  navTextActive: {
    color: C.cyan,
    fontSize: 8,
    fontWeight: '900',
    marginTop: 4,
  },
});