import { mainStoryObjective } from '../story/selectors';
import SystemScreen from '../components/SystemScreen';
import { DAILY_RULES } from '../daily/calendar';
import RewardSummary from '../components/RewardSummary';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import IdentityAvatar from '../components/IdentityAvatar';
import SystemError from '../components/SystemError';
import BottomNavigation from '../components/BottomNavigation';
import SystemAmbientBackground from '../components/SystemAmbientBackground';
import { AWAKENING_QUESTS, AWAKENING_REWARD_XP, getAwakeningProgress, getQuestStatus } from '../quests/catalog';
import { useCallback } from 'react';

import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
    type DimensionValue,
} from 'react-native';

import { useRouter, useFocusEffect } from 'expo-router';

import Animated, {
    Easing,
    FadeInUp,
    cancelAnimation,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

import {
    getPlayerProgressPercent,
    getSkillProgressPercent,
    SKILL_KEYS,
    SKILL_META,
    SYSTEM_COLORS,
    type SkillProgress
} from '../core';

import { useSystem } from '../state/SystemProvider';

function WorldSignalBeacon({ active }: { active: boolean }) {
  const pulse = useSharedValue(0);

  useFocusEffect(useCallback(() => {
    pulse.value = withRepeat(
      withTiming(1, {
        duration: 1700,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    return () => cancelAnimation(pulse);
  }, [pulse]));

  const beaconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.85, 1.35]) }],
    opacity: interpolate(pulse.value, [0, 0.5, 1], [0.22, 0.72, 0.12]),
  }));

  return (
    <View style={[styles.systemSignal, active && styles.systemSignalActive]}>
      <Animated.View style={[styles.systemSignalHalo, beaconStyle]} />
      <View style={styles.systemSignalDiamond} />
    </View>
  );
}

function PlayerCore() {
  const { player } = useSystem();
  const { width } = useWindowDimensions();
  const pulse = useSharedValue(0);
  const rotation = useSharedValue(0);
  const reverseRotation = useSharedValue(0);

  useFocusEffect(useCallback(() => {
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
    return () => { cancelAnimation(pulse); cancelAnimation(rotation); cancelAnimation(reverseRotation); };
  }, [pulse, rotation, reverseRotation]));

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
    <View style={[styles.coreContainer, width < 380 && { transform: [{ scale: 0.75 }] }]}>
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
        {player.avatarUri ? <IdentityAvatar uri={player.avatarUri} evolution={player.avatarEvolution} size={88} /> : <View style={styles.coreDiamondOuter}><View style={styles.coreDiamondInner} /></View>}
      </View>

      <Text style={styles.playerCoreText}>
        PLAYER CORE
      </Text>
    </View>
  );
}

function SkillCard({
  skill,
}: {
  skill: SkillProgress;
}) {
  const meta = SKILL_META[skill.key];

  const progress = getSkillProgressPercent(skill) * 100;

  return (
    <View style={styles.skillCard}>
      <View style={styles.skillTop}>
        <Text style={styles.skillCode}>
          {skill.key}
        </Text>

        <Text style={styles.skillLevel}>
          {skill.level}
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
              width: `${Math.max(3, Math.min(100, progress))}%` as DimensionValue,
            },
          ]}
        />
      </View>

      <Text style={styles.skillXp}>
        {skill.xp} / {skill.xpToNextLevel} XP
      </Text>
    </View>
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
  const insets = useSafeAreaInsets();
  const { lastReward, daily, story } = useSystem();
  const router = useRouter();

  const { player, ready, completedQuestIds, awakeningCompleted, worldUnlocked, activeQuestId, error, refreshPlayer } = useSystem();

  const realProgress =
    getPlayerProgressPercent(player) * 100;

  const awakening = getAwakeningProgress(completedQuestIds);
  const objective = mainStoryObjective(story,awakeningCompleted);
  const mainQuestProgress = awakeningCompleted ? objective.completed : awakening.completed;
  const mainQuestPercent = awakeningCompleted ? (objective.total ? objective.completed/objective.total*100 : 0) : awakening.percent;

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
          <SystemError message={error} retry={() => { void refreshPlayer(); }} />
        )}
      </View>
    );
  }

  return (
    <SystemScreen style={styles.root}>
      <SystemAmbientBackground intensity="hero" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          [styles.content, { paddingTop: 20, paddingBottom: insets.bottom + 130 }]
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

          <WorldSignalBeacon active={worldUnlocked} />
        </View>

        {/* PLAYER CARD */}

        <Animated.View entering={FadeInUp.duration(500).delay(60)} style={styles.playerCard}>
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
                {player.displayName} // {player.currentTitle}
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

            <View accessibilityRole="progressbar" accessibilityLabel={`Real XP ${player.realXp} z ${player.realXpToNextLevel}`} accessibilityValue={{ min: 0, max: 100, now: Math.round(realProgress) }} style={styles.realXpTrack}>
              <View
                style={[
                  styles.realXpFill,
                  {
                    width: `${Math.max(1.5, Math.min(100, realProgress))}%` as DimensionValue,
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
        </Animated.View>

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
                skill={data}
              />
            );
          })}
        </ScrollView>

        {/* MAIN QUEST */}

        <SectionTitle
          code="01 // ACTIVE OBJECTIVE"
          title="GŁÓWNA MISJA"
        />

        <Animated.View entering={FadeInUp.duration(500).delay(120)} style={styles.mainQuest}>
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
                  {story?.bossComplete ? 'SIGNAL LOST' : 'AVAILABLE'}
                </Text>
              </View>
            </View>

            <Text style={styles.questTitle}>
              {objective.title}
            </Text>

            <Text
              style={
                styles.questDescription
              }
            >
              {awakeningCompleted ? `${objective.subtitle} Daily ${daily?.completed ?? 0}/3 · Weekly ${Math.min(5,daily?.weeklyCompleted ?? 0)}/5` : 'Ukończ wszystkie misje Awakening. Każda wymaga rzeczywistej weryfikacji i przyznaje nagrodę tylko raz.'}
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
                  {mainQuestProgress} / {awakeningCompleted ? objective.total : awakening.total}
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
                  +{awakeningCompleted ? objective.reward : AWAKENING_REWARD_XP} REAL XP
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
                    width: `${Math.max(0, Math.min(100, mainQuestPercent))}%` as DimensionValue,
                  },
                ]}
              />
            </View>

            {awakeningCompleted && <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.startQuestButton, pressed && styles.startQuestButtonPressed]}
              onPress={() => router.push('/story')}>
              <Text style={styles.startQuestText}>STORY / CHRONICLE →</Text>
            </Pressable>}
            {!awakeningCompleted && AWAKENING_QUESTS.map(quest => {
              const status = getQuestStatus(quest.id, completedQuestIds, activeQuestId);
              const locked = status === 'LOCKED';
              return <Pressable key={quest.id}
                accessibilityRole="button"
                accessibilityLabel={`${quest.title} — ${status}`}
                accessibilityState={{ disabled: locked }}
                style={({ pressed }) => [styles.startQuestButton, pressed && styles.startQuestButtonPressed, locked && styles.lockedQuestButton]}
                disabled={locked}
                onPress={() => router.push({ pathname: '/quest', params: { questId: quest.id } })}>
                <Text style={[styles.startQuestText, locked && styles.lockedQuestTitle]}>{quest.title}</Text>
                {locked && <View style={[styles.questStatusBadge, styles.lockedQuestBadge]}><Text style={[styles.questStatusText, styles.lockedQuestText]}>{status}</Text></View>}
              </Pressable>;
            })}
          </View>
        </Animated.View>

        {lastReward && <RewardSummary receipt={lastReward} />}

        {/* WORLD */}

        <SectionTitle
          code="02 // WORLD SIGNAL"
          title="SYSTEM WORLD"
        />

        <Animated.View entering={FadeInUp.duration(500).delay(180)}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Otwórz SYSTEM WORLD"
            style={({ pressed }) => [styles.worldCard, pressed && styles.worldCardPressed, !worldUnlocked && { opacity: 0.8 }]}
            disabled={!worldUnlocked}
            onPress={() => router.replace('/world')}>
            <View style={styles.gateIcon}>
              <View style={styles.gateDiamond} />
            </View>

          <View style={styles.worldContent}>
            <Text style={styles.locked}>
              {worldUnlocked ? 'WORLD ONLINE' : 'LOCKED'}
            </Text>

            <Text style={styles.gateTitle}>
              {worldUnlocked ? 'EXPLORE SYSTEM WORLD' : 'WORLD LOCKED'}
            </Text>

            <Text
              style={
                styles.gateDescription
              }
            >
              {worldUnlocked ? 'Odkrywaj sektory i uruchom SCAN FOR SIGNAL, aby odnaleźć pierwszy sygnał.' : 'Ukończ Pierwsze Przebudzenie, aby odblokować dostęp do SYSTEM WORLD.'}
            </Text>
            </View>
          </Pressable>
        </Animated.View>

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

      <BottomNavigation />
    </SystemScreen>
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
    overflow: 'hidden',
  },

  systemSignalActive: {
    borderColor: SYSTEM_COLORS.cyan,
    shadowColor: SYSTEM_COLORS.cyan,
    shadowOpacity: 0.35,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 0 },
  },

  systemSignalHalo: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(108, 238, 255, 0.6)',
    backgroundColor: 'rgba(108, 238, 255, 0.08)',
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
    zIndex: 1,
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
    padding: 20,
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
    marginTop: 18,
  },

  questDescription: {
    color: SYSTEM_COLORS.textMuted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 11,
  },

  questStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 21,
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
    marginTop: 18,
    overflow: 'hidden',
  },

  questProgressFill: {
    height: '100%',
    backgroundColor:
      SYSTEM_COLORS.cyan,
  },

  startQuestButton: {
    minHeight: 62,
    borderRadius: 20,
    backgroundColor:
      SYSTEM_COLORS.cyan,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
    transform: [{ scale: 1 }],
  },

  startQuestButtonPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.96,
    backgroundColor: '#72effd',
  },

  startQuestText: {
    color: '#001015',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 2.5,
    flexShrink: 1,
  },

  lockedQuestButton: {
    backgroundColor: '#102329',
    borderWidth: 1,
    borderColor: SYSTEM_COLORS.line,
  },

  lockedQuestTitle: {
    color: SYSTEM_COLORS.text,
  },

  questStatusBadge: {
    flexShrink: 0,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#001015',
    backgroundColor: 'rgba(0,16,21,0.12)',
    paddingHorizontal: 9,
    paddingVertical: 6,
    marginLeft: 12,
  },

  lockedQuestBadge: {
    borderColor: SYSTEM_COLORS.textMuted,
    backgroundColor: 'rgba(113,128,134,0.12)',
  },

  questStatusText: {
    color: '#001015',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.1,
  },

  lockedQuestText: {
    color: SYSTEM_COLORS.textMuted,
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
    transform: [{ scale: 1 }],
  },

  worldCardPressed: {
    transform: [{ scale: 0.985 }],
    borderColor: SYSTEM_COLORS.cyan,
    backgroundColor: '#091d24',
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

});
