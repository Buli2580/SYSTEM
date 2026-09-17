import { useEffect } from 'react';

import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from 'react-native';

import { useRouter } from 'expo-router';

import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

import {
    Canvas,
    Circle,
    LinearGradient,
    Rect,
    vec,
} from '@shopify/react-native-skia';

import {
    getPlayerProgressPercent,
    SKILL_KEYS,
    SKILL_META,
    SYSTEM_COLORS,
    type SkillKey
} from '../core';

import { useSystem } from '../state/SystemProvider';

function SystemBackground() {
  const { width, height } = useWindowDimensions();

  return (
    <Canvas style={StyleSheet.absoluteFill}>
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
      >
        <LinearGradient
          start={vec(0, 0)}
          end={vec(width, height)}
          colors={[
            '#020708',
            '#031114',
            '#010506',
            '#000000',
          ]}
        />
      </Rect>

      <Circle
        cx={width * 0.88}
        cy={height * 0.15}
        r={width * 0.55}
        color="rgba(0,229,255,0.025)"
      />

      <Circle
        cx={width * 0.03}
        cy={height * 0.7}
        r={width * 0.7}
        color="rgba(0,229,255,0.018)"
      />
    </Canvas>
  );
}

function PlayerCore() {
  const pulse = useSharedValue(0);
  const rotation = useSharedValue(0);
  const reverseRotation = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, {
        duration: 1700,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    rotation.value = withRepeat(
      withTiming(1, {
        duration: 9000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    reverseRotation.value = withRepeat(
      withTiming(1, {
        duration: 13000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [pulse, rotation, reverseRotation]);

  const pulseStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(
            pulse.value,
            [0, 1],
            [0.96, 1.06]
          ),
        },
      ],

      opacity: interpolate(
        pulse.value,
        [0, 1],
        [0.35, 0.8]
      ),
    };
  });

  const rotationStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${rotation.value * 360}deg`,
        },
      ],
    };
  });

  const reverseStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${reverseRotation.value * -360}deg`,
        },
      ],
    };
  });

  return (
    <View style={styles.coreContainer}>
      <Animated.View
        style={[
          styles.corePulse,
          pulseStyle,
        ]}
      />

      <Animated.View
        style={[
          styles.coreRingOuter,
          rotationStyle,
        ]}
      >
        <View style={styles.orbitPointOne} />

        <View style={styles.orbitPointTwo} />
      </Animated.View>

      <Animated.View
        style={[
          styles.coreRingMiddle,
          reverseStyle,
        ]}
      >
        <View style={styles.orbitPointThree} />
      </Animated.View>

      <View style={styles.coreRingInner}>
        <View style={styles.coreDiamondOuter}>
          <View style={styles.coreDiamondInner} />
        </View>
      </View>

      <Text style={styles.playerCoreText}>
        PLAYER CORE
      </Text>
    </View>
  );
}

function SkillCard({
  skill,
  level,
  xp,
  xpToNextLevel,
}: {
  skill: SkillKey;
  level: number;
  xp: number;
  xpToNextLevel: number;
}) {
  const meta = SKILL_META[skill];

  const progress =
    xpToNextLevel > 0
      ? Math.min(100, (xp / xpToNextLevel) * 100)
      : 0;

  return (
    <Pressable style={styles.skillCard}>
      <View style={styles.skillTop}>
        <Text style={styles.skillCode}>
          {skill}
        </Text>

        <Text style={styles.skillLevel}>
          {level}
        </Text>
      </View>

      <Text style={styles.skillName}>
        {meta.name}
      </Text>

      <View style={styles.skillProgress}>
        <View
          style={[
            styles.skillProgressFill,
            {
              width: `${Math.max(
                3,
                progress
              )}%`,
            },
          ]}
        />
      </View>

      <Text style={styles.skillXp}>
        {xp} / {xpToNextLevel} XP
      </Text>
    </Pressable>
  );
}

function SectionTitle({
  code,
  title,
}: {
  code: string;
  title: string;
}) {
  return (
    <View style={styles.sectionWrap}>
      <View>
        <Text style={styles.sectionCode}>
          {code}
        </Text>

        <Text style={styles.sectionTitle}>
          {title}
        </Text>
      </View>

      <View style={styles.sectionLine} />
    </View>
  );
}

export default function SystemHomeScreen() {
  const router = useRouter();

  const { player, ready, error, refreshPlayer } = useSystem();

  const realProgress =
    getPlayerProgressPercent(player) * 100;

  const mainQuestProgress = Math.min(
    player.verifiedQuestCount,
    3
  );

  const mainQuestPercent =
    (mainQuestProgress / 3) * 100;

  if (!ready) {
    return (
      <View style={styles.loadingRoot}>
        <Text style={styles.loadingSmall}>
          {error ? 'SYSTEM // BŁĄD ZAPISU' : 'SYSTEM // INITIALIZING'}
        </Text>

        <Text style={styles.loadingTitle}>
          AWAKENING
        </Text>
        {error && (
          <>
            <Text style={styles.loadingSmall}>{error}</Text>
            <Pressable onPress={() => { void refreshPlayer(); }}>
              <Text style={styles.loadingSmall}>SPRÓBUJ PONOWNIE</Text>
            </Pressable>
          </>
        )}
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SystemBackground />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.content
        }
      >
        {/* HEADER */}

        <View style={styles.header}>
          <View>
            <Text style={styles.systemOnline}>
              SYSTEM // ONLINE
            </Text>

            <Text style={styles.awakening}>
              AWAKENING
            </Text>
          </View>

          <View style={styles.systemSignal}>
            <View
              style={
                styles.systemSignalDiamond
              }
            />
          </View>
        </View>

        {/* PLAYER CARD */}

        <View style={styles.playerCard}>
          <View style={styles.playerGlow} />

          <View style={styles.playerTop}>
            <View>
              <Text
                style={
                  styles.identityLabel
                }
              >
                REAL IDENTITY
              </Text>

              <Text
                style={
                  styles.awakeningActive
                }
              >
                AWAKENING FORM // ACTIVE
              </Text>
            </View>

            <View style={styles.originBadge}>
              <Text
                style={
                  styles.originText
                }
              >
                ORIGIN 0
              </Text>
            </View>
          </View>

          <View style={styles.identityContent}>
            <View style={styles.coreColumn}>
              <PlayerCore />
            </View>

            <View style={styles.levelColumn}>
              <Text
                style={
                  styles.realRankLabel
                }
              >
                REAL RANK
              </Text>

              <View style={styles.levelRow}>
                <Text
                  style={
                    styles.levelPrefix
                  }
                >
                  LV.
                </Text>

                <Text
                  style={
                    styles.levelNumber
                  }
                >
                  {player.realLevel}
                </Text>
              </View>

              <View style={styles.rankBadge}>
                <Text
                  style={
                    styles.rankBadgeText
                  }
                >
                  RANGA {player.rank}
                </Text>
              </View>

              <View
                style={
                  styles.evolutionDivider
                }
              />

              <Text
                style={
                  styles.evolutionLabel
                }
              >
                EVOLUTION
              </Text>

              <Text
                style={
                  styles.evolutionValue
                }
              >
                STAGE{' '}
                {player.avatarEvolution}
              </Text>
            </View>
          </View>

          <Text style={styles.equalOrigin}>
            EQUAL ORIGIN // KAŻDY ZACZYNA OD TEGO
            SAMEGO PUNKTU
          </Text>

          {/* XP */}

          <View style={styles.realXpBlock}>
            <View style={styles.realXpHeader}>
              <Text
                style={
                  styles.realXpLabel
                }
              >
                REAL XP
              </Text>

              <Text
                style={
                  styles.realXpValue
                }
              >
                {player.realXp} /{' '}
                {player.realXpToNextLevel}
              </Text>
            </View>

            <View style={styles.realXpTrack}>
              <View
                style={[
                  styles.realXpFill,
                  {
                    width: `${Math.max(
                      1.5,
                      realProgress
                    )}%`,
                  },
                ]}
              />
            </View>
          </View>

          {/* QUICK STATS */}

          <View style={styles.playerDivider} />

          <View style={styles.quickStats}>
            <View style={styles.quickStat}>
              <Text
                style={
                  styles.quickNumber
                }
              >
                {player.streak}
              </Text>

              <Text
                style={
                  styles.quickLabel
                }
              >
                STREAK
              </Text>
            </View>

            <View
              style={
                styles.quickDivider
              }
            />

            <View style={styles.quickStat}>
              <Text
                style={
                  styles.quickNumber
                }
              >
                {player.verifiedQuestCount}
              </Text>

              <Text
                style={
                  styles.quickLabel
                }
              >
                VERIFIED
              </Text>
            </View>

            <View
              style={
                styles.quickDivider
              }
            />

            <View style={styles.quickStat}>
              <Text
                style={
                  styles.quickNumber
                }
              >
                {player.gameEnergy}
              </Text>

              <Text
                style={
                  styles.quickLabel
                }
              >
                ENERGY
              </Text>
            </View>
          </View>
        </View>

        {/* SKILLS */}

        <View style={styles.skillsHeader}>
          <Text style={styles.skillsTitle}>
            7 REAL SKILLS
          </Text>

          <Text style={styles.buildText}>
            BUILD
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={
            styles.skillsRow
          }
        >
          {SKILL_KEYS.map((skill) => {
            const data =
              player.stats[skill];

            return (
              <SkillCard
                key={skill}
                skill={skill}
                level={data.level}
                xp={data.xp}
                xpToNextLevel={
                  data.xpToNextLevel
                }
              />
            );
          })}
        </ScrollView>

        {/* MAIN QUEST */}

        <SectionTitle
          code="01 // ACTIVE OBJECTIVE"
          title="GŁÓWNA MISJA"
        />

        <View style={styles.mainQuest}>
          <View style={styles.questAccent} />

          <View style={styles.questContent}>
            <View style={styles.questHeader}>
              <Text
                style={
                  styles.questCategory
                }
              >
                MAIN QUEST
              </Text>

              <View
                style={
                  styles.availableBadge
                }
              >
                <Text
                  style={
                    styles.availableText
                  }
                >
                  AVAILABLE
                </Text>
              </View>
            </View>

            <Text style={styles.questTitle}>
              PIERWSZE PRZEBUDZENIE
            </Text>

            <Text
              style={
                styles.questDescription
              }
            >
              Ukończ 3 prawdziwe i
              zweryfikowane misje. Dopiero
              wtedy SYSTEM uzna przebudzenie
              za zakończone.
            </Text>

            <View style={styles.questStats}>
              <View>
                <Text
                  style={
                    styles.questStatLabel
                  }
                >
                  PROGRESS
                </Text>

                <Text
                  style={
                    styles.questStatValue
                  }
                >
                  {mainQuestProgress} / 3
                </Text>
              </View>

              <View>
                <Text
                  style={
                    styles.questStatLabel
                  }
                >
                  REWARD
                </Text>

                <Text
                  style={
                    styles.questReward
                  }
                >
                  +300 XP
                </Text>
              </View>

              <View>
                <Text
                  style={
                    styles.questStatLabel
                  }
                >
                  VERIFY
                </Text>

                <Text
                  style={
                    styles.questStatValue
                  }
                >
                  REQUIRED
                </Text>
              </View>
            </View>

            <View
              style={
                styles.questProgressTrack
              }
            >
              <View
                style={[
                  styles.questProgressFill,
                  {
                    width: `${Math.max(
                      1,
                      mainQuestPercent
                    )}%`,
                  },
                ]}
              />
            </View>

            <Pressable
              style={
                styles.startQuestButton
              }
              onPress={() =>
                router.push('/quest')
              }
            >
              <Text
                style={
                  styles.startQuestText
                }
              >
                ROZPOCZNIJ MISJĘ
              </Text>

              <Text
                style={
                  styles.startQuestArrow
                }
              >
                →
              </Text>
            </Pressable>
          </View>
        </View>

        {/* WORLD */}

        <SectionTitle
          code="02 // WORLD SIGNAL"
          title="SYSTEM WORLD"
        />

        <Pressable style={styles.worldCard}>
          <View style={styles.gateIcon}>
            <View
              style={
                styles.gateDiamond
              }
            />
          </View>

          <View style={styles.worldContent}>
            <Text style={styles.locked}>
              LOCKED
            </Text>

            <Text style={styles.gateTitle}>
              UNKNOWN GATE
            </Text>

            <Text
              style={
                styles.gateDescription
              }
            >
              Ukończ Pierwsze Przebudzenie,
              aby SYSTEM aktywował mapę,
              eksplorację i pierwszy Gate.
            </Text>
          </View>
        </Pressable>

        <View style={styles.protocol}>
          <Text
            style={
              styles.protocolSmall
            }
          >
            SYSTEM PROTOCOL // 2.0
          </Text>

          <Text
            style={
              styles.protocolText
            }
          >
            TWOJE ŻYCIE. TWOJA POSTAĆ. TWÓJ
            ŚWIAT.
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* BOTTOM NAVIGATION */}

      <View style={styles.bottomNav}>
        <Pressable style={styles.navItem}>
          <View
            style={
              styles.activeNavDiamond
            }
          />

          <Text
            style={
              styles.activeNavText
            }
          >
            SYSTEM
          </Text>
        </Pressable>

        <Pressable style={styles.navItem}>
          <View style={styles.navDiamond} />

          <Text style={styles.navText}>
            QUESTY
          </Text>
        </Pressable>

        <Pressable style={styles.navItem}>
          <View style={styles.navDiamond} />

          <Text style={styles.navText}>
            POSTAĆ
          </Text>
        </Pressable>

        <Pressable style={styles.navItem}>
          <View style={styles.navCircle} />

          <Text style={styles.navText}>
            ŚWIAT
          </Text>
        </Pressable>

        <Pressable style={styles.navItem}>
          <View style={styles.dots}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>

          <Text style={styles.navText}>
            WIĘCEJ
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor:
      SYSTEM_COLORS.background,
  },

  loadingRoot: {
    flex: 1,
    backgroundColor:
      SYSTEM_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingSmall: {
    color: SYSTEM_COLORS.cyan,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 4,
  },

  loadingTitle: {
    color: SYSTEM_COLORS.white,
    fontSize: 38,
    fontWeight: '900',
    marginTop: 12,
  },

  content: {
    paddingTop: 72,
    paddingHorizontal: 25,
    paddingBottom: 140,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 26,
  },

  systemOnline: {
    color: SYSTEM_COLORS.cyan,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 4,
  },

  awakening: {
    color: SYSTEM_COLORS.white,
    fontSize: 32,
    lineHeight: 39,
    fontWeight: '900',
    marginTop: 6,
  },

  systemSignal: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 1,
    borderColor: SYSTEM_COLORS.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#061014',
  },

  systemSignalDiamond: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: SYSTEM_COLORS.cyan,
    transform: [
      {
        rotate: '45deg',
      },
    ],
  },

  playerCard: {
    borderWidth: 1,
    borderColor: SYSTEM_COLORS.line,
    borderRadius: 31,
    backgroundColor: '#051014',
    overflow: 'hidden',
    padding: 25,
  },

  playerGlow: {
    position: 'absolute',
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor:
      'rgba(0,229,255,0.025)',
    right: -170,
    top: -60,
  },

  playerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  identityLabel: {
    color:
      SYSTEM_COLORS.textVeryMuted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 4,
  },

  awakeningActive: {
    color: SYSTEM_COLORS.cyan,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2.3,
    marginTop: 10,
  },

  originBadge: {
    borderWidth: 1,
    borderColor:
      SYSTEM_COLORS.lineBright,
    borderRadius: 999,
    paddingHorizontal: 17,
    paddingVertical: 10,
  },

  originText: {
    color: SYSTEM_COLORS.cyan,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
  },

  identityContent: {
    flexDirection: 'row',
    marginTop: 18,
  },

  coreColumn: {
    flex: 1.15,
  },

  levelColumn: {
    flex: 0.85,
    justifyContent: 'center',
    paddingLeft: 5,
  },

  coreContainer: {
    height: 310,
    alignItems: 'center',
    justifyContent: 'center',
  },

  corePulse: {
    position: 'absolute',
    width: 255,
    height: 255,
    borderRadius: 128,
    borderWidth: 1,
    borderColor:
      SYSTEM_COLORS.cyanDark,
  },

  coreRingOuter: {
    position: 'absolute',
    width: 225,
    height: 225,
    borderRadius: 113,
    borderWidth: 1,
    borderColor:
      SYSTEM_COLORS.lineBright,
  },

  coreRingMiddle: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1,
    borderColor:
      SYSTEM_COLORS.cyanDark,
  },

  coreRingInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
    borderColor:
      SYSTEM_COLORS.lineBright,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(0,229,255,0.018)',
  },

  orbitPointOne: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor:
      SYSTEM_COLORS.cyan,
    top: -4,
    left: 108,
  },

  orbitPointTwo: {
    position: 'absolute',
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor:
      SYSTEM_COLORS.cyan,
    bottom: 33,
    right: -2,
  },

  orbitPointThree: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor:
      SYSTEM_COLORS.cyanSoft,
    bottom: -3,
    left: 82,
  },

  coreDiamondOuter: {
    width: 56,
    height: 56,
    borderWidth: 3,
    borderColor:
      SYSTEM_COLORS.cyan,
    transform: [
      {
        rotate: '45deg',
      },
    ],
    alignItems: 'center',
    justifyContent: 'center',
  },

  coreDiamondInner: {
    width: 18,
    height: 18,
    backgroundColor:
      SYSTEM_COLORS.cyan,
  },

  playerCoreText: {
    position: 'absolute',
    bottom: 18,
    color:
      SYSTEM_COLORS.textVeryMuted,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 3,
  },

  realRankLabel: {
    color:
      SYSTEM_COLORS.textVeryMuted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 3,
  },

  levelRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 8,
  },

  levelPrefix: {
    color: SYSTEM_COLORS.cyan,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 10,
    marginRight: 7,
  },

  levelNumber: {
    color: SYSTEM_COLORS.white,
    fontSize: 72,
    lineHeight: 78,
    fontWeight: '900',
  },

  rankBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor:
      SYSTEM_COLORS.lineBright,
    borderRadius: 999,
    paddingHorizontal: 19,
    paddingVertical: 10,
    marginTop: 4,
  },

  rankBadgeText: {
    color: SYSTEM_COLORS.cyan,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2.5,
  },

  evolutionDivider: {
    width: 68,
    height: 1,
    backgroundColor:
      SYSTEM_COLORS.line,
    marginTop: 20,
    marginBottom: 16,
  },

  evolutionLabel: {
    color:
      SYSTEM_COLORS.textVeryMuted,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 3,
  },

  evolutionValue: {
    color: SYSTEM_COLORS.white,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 7,
  },

  equalOrigin: {
    color: SYSTEM_COLORS.textMuted,
    fontSize: 8,
    lineHeight: 14,
    textAlign: 'center',
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 2,
  },

  realXpBlock: {
    marginTop: 28,
  },

  realXpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  realXpLabel: {
    color: SYSTEM_COLORS.textMuted,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2.5,
  },

  realXpValue: {
    color: SYSTEM_COLORS.cyan,
    fontSize: 12,
    fontWeight: '900',
  },

  realXpTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#09272D',
    overflow: 'hidden',
    marginTop: 12,
  },

  realXpFill: {
    height: '100%',
    backgroundColor:
      SYSTEM_COLORS.cyan,
    borderRadius: 999,
  },

  playerDivider: {
    height: 1,
    backgroundColor:
      SYSTEM_COLORS.line,
    marginTop: 30,
  },

  quickStats: {
    flexDirection: 'row',
    marginTop: 23,
  },

  quickStat: {
    flex: 1,
    alignItems: 'center',
  },

  quickNumber: {
    color: SYSTEM_COLORS.white,
    fontSize: 29,
    fontWeight: '900',
  },

  quickLabel: {
    color:
      SYSTEM_COLORS.textVeryMuted,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 8,
  },

  quickDivider: {
    width: 1,
    height: 48,
    backgroundColor:
      SYSTEM_COLORS.line,
  },

  skillsHeader: {
    marginTop: 30,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  skillsTitle: {
    color: SYSTEM_COLORS.cyan,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3,
  },

  buildText: {
    color:
      SYSTEM_COLORS.textVeryMuted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 3,
  },

  skillsRow: {
    gap: 10,
    paddingRight: 20,
  },

  skillCard: {
    width: 150,
    minHeight: 145,
    borderWidth: 1,
    borderColor: SYSTEM_COLORS.line,
    borderRadius: 23,
    backgroundColor: '#051014',
    padding: 17,
  },

  skillTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  skillCode: {
    color: SYSTEM_COLORS.cyan,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },

  skillLevel: {
    color: SYSTEM_COLORS.white,
    fontSize: 32,
    lineHeight: 34,
    fontWeight: '900',
  },

  skillName: {
    color: SYSTEM_COLORS.textMuted,
    fontSize: 9,
    fontWeight: '900',
    marginTop: 13,
  },

  skillProgress: {
    height: 5,
    borderRadius: 999,
    backgroundColor: '#09272D',
    marginTop: 18,
    overflow: 'hidden',
  },

  skillProgressFill: {
    height: '100%',
    backgroundColor:
      SYSTEM_COLORS.cyan,
  },

  skillXp: {
    color:
      SYSTEM_COLORS.textVeryMuted,
    fontSize: 7,
    marginTop: 8,
    fontWeight: '800',
  },

  sectionWrap: {
    marginTop: 42,
    marginBottom: 19,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },

  sectionCode: {
    color: SYSTEM_COLORS.cyan,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 8,
  },

  sectionTitle: {
    color: SYSTEM_COLORS.white,
    fontSize: 30,
    fontWeight: '900',
  },

  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor:
      SYSTEM_COLORS.line,
    marginLeft: 20,
    marginBottom: 10,
  },

  mainQuest: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: SYSTEM_COLORS.line,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#061115',
  },

  questAccent: {
    width: 5,
    backgroundColor:
      SYSTEM_COLORS.cyan,
  },

  questContent: {
    flex: 1,
    padding: 23,
  },

  questHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  questCategory: {
    color: SYSTEM_COLORS.cyan,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2.5,
  },

  availableBadge: {
    borderRadius: 999,
    backgroundColor:
      'rgba(0,229,255,0.07)',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  availableText: {
    color: SYSTEM_COLORS.cyan,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  questTitle: {
    color: SYSTEM_COLORS.white,
    fontSize: 29,
    lineHeight: 34,
    fontWeight: '900',
    marginTop: 25,
  },

  questDescription: {
    color: SYSTEM_COLORS.textMuted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 14,
  },

  questStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 28,
  },

  questStatLabel: {
    color:
      SYSTEM_COLORS.textVeryMuted,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 2,
  },

  questStatValue: {
    color: SYSTEM_COLORS.white,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 8,
  },

  questReward: {
    color: SYSTEM_COLORS.cyan,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 8,
  },

  questProgressTrack: {
    height: 7,
    backgroundColor: '#09272D',
    borderRadius: 999,
    marginTop: 24,
    overflow: 'hidden',
  },

  questProgressFill: {
    height: '100%',
    backgroundColor:
      SYSTEM_COLORS.cyan,
  },

  startQuestButton: {
    height: 78,
    borderRadius: 20,
    backgroundColor:
      SYSTEM_COLORS.cyan,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 27,
    marginTop: 27,
  },

  startQuestText: {
    color: '#001015',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 2.5,
  },

  startQuestArrow: {
    color: '#001015',
    fontSize: 37,
  },

  worldCard: {
    borderWidth: 1,
    borderColor: SYSTEM_COLORS.line,
    borderRadius: 28,
    backgroundColor: '#051014',
    padding: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },

  gateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor:
      SYSTEM_COLORS.lineBright,
    alignItems: 'center',
    justifyContent: 'center',
  },

  gateDiamond: {
    width: 34,
    height: 34,
    borderWidth: 2,
    borderColor:
      SYSTEM_COLORS.cyan,
    transform: [
      {
        rotate: '45deg',
      },
    ],
  },

  worldContent: {
    flex: 1,
    paddingLeft: 25,
  },

  locked: {
    color: SYSTEM_COLORS.danger,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 3,
  },

  gateTitle: {
    color: SYSTEM_COLORS.white,
    fontSize: 21,
    fontWeight: '900',
    marginTop: 8,
  },

  gateDescription: {
    color: SYSTEM_COLORS.textMuted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 10,
  },

  protocol: {
    alignItems: 'center',
    marginTop: 65,
  },

  protocolSmall: {
    color:
      SYSTEM_COLORS.textVeryMuted,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 4,
  },

  protocolText: {
    color: SYSTEM_COLORS.textMuted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 15,
  },

  bottomSpacer: {
    height: 45,
  },

  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 108,
    backgroundColor:
      'rgba(1,6,8,0.98)',
    borderTopWidth: 1,
    borderTopColor:
      SYSTEM_COLORS.line,
    flexDirection: 'row',
    paddingTop: 17,
  },

  navItem: {
    flex: 1,
    alignItems: 'center',
  },

  activeNavDiamond: {
    width: 23,
    height: 23,
    backgroundColor:
      SYSTEM_COLORS.cyan,
    transform: [
      {
        rotate: '45deg',
      },
    ],
    marginBottom: 14,
  },

  navDiamond: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor:
      SYSTEM_COLORS.textVeryMuted,
    transform: [
      {
        rotate: '45deg',
      },
    ],
    marginBottom: 14,
  },

  navCircle: {
    width: 23,
    height: 23,
    borderRadius: 12,
    borderWidth: 1,
    borderColor:
      SYSTEM_COLORS.textVeryMuted,
    marginBottom: 13,
  },

  dots: {
    height: 23,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 13,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor:
      SYSTEM_COLORS.textVeryMuted,
  },

  activeNavText: {
    color: SYSTEM_COLORS.cyan,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  navText: {
    color:
      SYSTEM_COLORS.textVeryMuted,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
});