import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import BottomNavigation from '../components/BottomNavigation';
import IdentityAvatar from '../components/IdentityAvatar';
import SystemError from '../components/SystemError';
import SystemScreen from '../components/SystemScreen';
import { getPlayerProgressPercent, SYSTEM_COLORS } from '../core';
import { AWAKENING_QUESTS, AWAKENING_REWARD_XP, getAwakeningProgress, getQuestStatus } from '../quests/catalog';
import { useSystem } from '../state/SystemProvider';
import { mainStoryObjective } from '../story/selectors';

const CYAN = '#6CEEFF';
const SKY = '#071017';
const FIRE = '#FF6A2A';
const GOLD = '#FFC45B';

function Rain({ reduced }: { reduced: boolean }) {
  const rain = useSharedValue(0);
  useFocusEffect(useCallback(() => {
    if (reduced) return;
    rain.value = withRepeat(withTiming(1, { duration: 1050, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(rain);
  }, [rain, reduced]));
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(rain.value, [0, 1], [-70, 190]) }],
    opacity: reduced ? 0.12 : 0.34,
  }));
  return <Animated.View pointerEvents="none" style={[styles.rainLayer, style]}>
    {Array.from({ length: reduced ? 8 : 22 }).map((_, i) => (
      <View key={i} style={[styles.rainDrop, { left: `${(i * 47) % 100}%`, top: (i * 31) % 150, height: 18 + (i % 4) * 8 }]} />
    ))}
  </Animated.View>;
}

function WorldScene({ reduced, bossActive }: { reduced: boolean; bossActive: boolean }) {
  const drift = useSharedValue(0);
  const portal = useSharedValue(0);
  const flash = useSharedValue(0);

  useFocusEffect(useCallback(() => {
    drift.value = withRepeat(withTiming(1, { duration: 9000, easing: Easing.inOut(Easing.ease) }), -1, true);
    portal.value = withRepeat(withTiming(1, { duration: 2100, easing: Easing.inOut(Easing.ease) }), -1, true);
    if (!reduced) flash.value = withRepeat(withTiming(1, { duration: 7600, easing: Easing.linear }), -1, false);
    return () => { cancelAnimation(drift); cancelAnimation(portal); cancelAnimation(flash); };
  }, [drift, portal, flash, reduced]));

  const far = useAnimatedStyle(() => ({ transform: [{ translateX: interpolate(drift.value, [0, 1], [-5, 5]) }] }));
  const mid = useAnimatedStyle(() => ({ transform: [{ translateX: interpolate(drift.value, [0, 1], [8, -8]) }] }));
  const portalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(portal.value, [0, 1], [0.94, 1.06]) }],
    opacity: interpolate(portal.value, [0, 1], [0.58, 0.95]),
  }));
  const lightning = useAnimatedStyle(() => ({
    opacity: reduced ? 0 : interpolate(flash.value, [0, .86, .88, .9, 1], [0, 0, .38, 0, 0]),
  }));

  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <View style={[StyleSheet.absoluteFill, styles.sky]} />
    <View style={styles.moonGlow} />
    <Animated.View style={[styles.farCity, far]}>
      {[58, 95, 72, 130, 84, 112, 64, 145, 88].map((h, i) => <View key={i} style={[styles.farTower, { height: h, left: i * 48 - 16 }]} />)}
    </Animated.View>
    <View style={styles.horizonFog} />
    <Animated.View style={[styles.midCity, mid]}>
      <View style={[styles.ruin, { left: -24, height: 250, width: 122 }]} />
      <View style={[styles.ruin, styles.ruinBroken, { right: -35, height: 290, width: 142 }]} />
      <View style={[styles.ruin, { right: 90, height: 160, width: 76, opacity: .5 }]} />
    </Animated.View>

    <View style={styles.portalAnchor}>
      <Animated.View style={[styles.portalGlow, portalStyle]} />
      <Animated.View style={[styles.portalRing, portalStyle]} />
      <View style={styles.portalCore} />
    </View>

    {bossActive && <View style={styles.bossSilhouette}>
      <View style={styles.bossHornLeft} /><View style={styles.bossHornRight} />
      <View style={styles.bossHead}><View style={styles.bossEye} /><View style={[styles.bossEye, { right: 13, left: undefined }]} /></View>
      <View style={styles.bossBody} />
    </View>}

    <View style={styles.fireLeft}><View style={styles.fireGlow} /><Text style={styles.fireGlyph}>▲</Text></View>
    <View style={styles.fireRight}><View style={styles.fireGlow} /><Text style={styles.fireGlyph}>▲</Text></View>
    {!reduced && Array.from({ length: 9 }).map((_, i) => <View key={i} style={[styles.ember, { left: `${8 + ((i * 19) % 84)}%`, bottom: 110 + (i * 43) % 220 }]} />)}
    <Rain reduced={reduced} />
    <Animated.View style={[StyleSheet.absoluteFill, styles.lightning, lightning]} />
    <View style={styles.foregroundFog} />
    <View style={styles.ground} />
  </View>;
}

function PlayerHero() {
  const { player } = useSystem();
  const breathe = useSharedValue(0);
  useFocusEffect(useCallback(() => {
    breathe.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.ease) }), -1, true);
    return () => cancelAnimation(breathe);
  }, [breathe]));
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: interpolate(breathe.value, [0, 1], [1, -4]) }, { scale: interpolate(breathe.value, [0, 1], [1, 1.012]) }] }));

  return <Animated.View pointerEvents="none" style={[styles.playerHero, style]}>
    <View style={styles.playerAura} />
    <View style={styles.playerHead}>
      {player.avatarUri ? <IdentityAvatar uri={player.avatarUri} evolution={player.avatarEvolution} size={82} /> : <View style={styles.faceless}><View style={styles.eyeLine} /></View>}
    </View>
    <View style={styles.playerShoulders} />
    <View style={styles.playerBody}><View style={styles.chestCore} /></View>
    <View style={styles.playerLegLeft} /><View style={styles.playerLegRight} />
  </Animated.View>;
}

function Hud({ top }: { top: number }) {
  const { player } = useSystem();
  const xp = getPlayerProgressPercent(player) * 100;
  return <View pointerEvents="box-none" style={[styles.hud, { top: top + 8 }]}>
    <View style={styles.levelHud}>
      <Text style={styles.levelMicro}>LEVEL</Text>
      <Text style={styles.levelValue}>{player.realLevel}</Text>
      <View style={styles.xpTrack}><View style={[styles.xpFill, { width: `${Math.max(2, xp)}%` }]} /></View>
      <Text style={styles.xpText}>{player.realXp} / {player.realXpToNextLevel} XP</Text>
    </View>
    <View style={styles.hudRight}>
      <View style={styles.hudPill}><Text style={styles.hudIcon}>ϟ</Text><Text style={styles.hudValue}>{player.gameEnergy}</Text><Text style={styles.hudLabel}>ENERGY</Text></View>
      <View style={styles.hudPill}><Text style={[styles.hudIcon, { color: GOLD }]}>🔥</Text><Text style={styles.hudValue}>{player.streak}</Text><Text style={styles.hudLabel}>STREAK</Text></View>
    </View>
  </View>;
}

function WorldNode({ label, sub, style, onPress, locked = false }: { label: string; sub: string; style: object; onPress: () => void; locked?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={locked} onPress={onPress} style={({ pressed }) => [styles.worldNode, style, locked && styles.nodeLocked, pressed && styles.nodePressed]}>
    <View style={styles.nodeBeacon}><View style={styles.nodeDot} /></View>
    <Text style={styles.nodeLabel}>{label}</Text>
    <Text style={styles.nodeSub}>{sub}</Text>
  </Pressable>;
}

export default function SystemHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const {
    player, ready, completedQuestIds, awakeningCompleted, worldUnlocked,
    activeQuestId, error, refreshPlayer, daily, story,
  } = useSystem();

  const reduced = width < 370 || height < 700;
  const awakening = getAwakeningProgress(completedQuestIds);
  const objective = mainStoryObjective(story, awakeningCompleted);
  const progress = awakeningCompleted ? objective.completed : awakening.completed;
  const total = awakeningCompleted ? objective.total : awakening.total;
  const percent = total ? Math.min(100, progress / total * 100) : 0;
  const nextQuest = AWAKENING_QUESTS.find(q => {
    const s = getQuestStatus(q.id, completedQuestIds, activeQuestId);
    return s === 'ACTIVE' || s === 'AVAILABLE';
  });
  const active = !awakeningCompleted && nextQuest
    ? { title: nextQuest.title, subtitle: 'AWAKENING PROTOCOL', action: activeQuestId === nextQuest.id ? 'CONTINUE' : 'START', route: { pathname: '/quest' as const, params: { questId: nextQuest.id } } }
    : { title: objective.title, subtitle: objective.subtitle, action: 'CONTINUE', route: '/story' as const };
  const bossActive = !story?.bossComplete && awakeningCompleted;
  const weekly = Math.min(5, daily?.weeklyCompleted ?? 0);
  const dailyDone = daily?.completed ?? 0;

  if (!ready) return <View style={styles.loadingRoot}>
    <Text style={styles.loadingSmall}>{error ? 'SYSTEM // BŁĄD ZAPISU' : 'SYSTEM // INITIALIZING'}</Text>
    <Text style={styles.loadingTitle}>AWAKENING</Text>
    {error && <SystemError message={error} retry={() => { void refreshPlayer(); }} />}
  </View>;

  return <SystemScreen style={styles.root}>
    <View style={styles.scene}>
      <WorldScene reduced={reduced} bossActive={bossActive} />
      <Hud top={insets.top} />

      <Pressable accessibilityRole="button" accessibilityLabel="Otwórz SYSTEM WORLD" disabled={!worldUnlocked} onPress={() => router.push('/world')} style={styles.portalTouch}>
        <Text style={styles.portalLabel}>{worldUnlocked ? 'WORLD GATE' : 'WORLD LOCKED'}</Text>
      </Pressable>

      <WorldNode label="DAILY" sub={`${dailyDone}/3`} style={styles.dailyNode} onPress={() => router.push('/quests')} />
      <WorldNode label="WEEKLY" sub={`${weekly}/5`} style={styles.weeklyNode} onPress={() => router.push('/quests')} />
      <WorldNode label="BOSS" sub={story?.bossComplete ? 'DEFEATED' : bossActive ? 'ENCOUNTER' : 'DORMANT'} style={styles.bossNode} onPress={() => router.push('/story')} locked={!awakeningCompleted} />

      <PlayerHero />

      <View style={[styles.questCallout, { bottom: Math.max(insets.bottom + 82, 94) }]}>
        <Text style={styles.questEyebrow}>ACTIVE QUEST // {active.subtitle}</Text>
        <Text numberOfLines={2} style={styles.questTitle}>{active.title}</Text>
        <View style={styles.questProgressRow}>
          <View style={styles.questProgressTrack}><View style={[styles.questProgressFill, { width: `${Math.max(2, percent)}%` }]} /></View>
          <Text style={styles.questProgressText}>{progress}/{total}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => router.push(active.route as never)} style={({ pressed }) => [styles.questAction, pressed && styles.questActionPressed]}>
          <Text style={styles.questActionText}>{active.action} MISSION</Text>
          <Text style={styles.questReward}>+{awakeningCompleted ? objective.reward : AWAKENING_REWARD_XP} XP  →</Text>
        </Pressable>
      </View>

      <View pointerEvents="none" style={styles.worldState}>
        <Text style={styles.worldStateText}>SYSTEM WORLD // {bossActive ? 'THREAT DETECTED' : worldUnlocked ? 'ONLINE' : 'AWAKENING'}</Text>
        <Text style={styles.playerName}>{player.displayName} · {player.currentTitle}</Text>
      </View>
    </View>
    <BottomNavigation />
  </SystemScreen>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#020508' },
  scene: { flex: 1, overflow: 'hidden', backgroundColor: SKY },
  sky: { backgroundColor: '#050A10' },
  moonGlow: { position: 'absolute', width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(35,100,125,.12)', top: -120, right: -90 },
  farCity: { position: 'absolute', left: -20, right: -20, top: '16%', height: 180, opacity: .56 },
  farTower: { position: 'absolute', bottom: 0, width: 38, backgroundColor: '#0A151B', borderTopWidth: 1, borderColor: '#16303A' },
  horizonFog: { position: 'absolute', left: 0, right: 0, top: '34%', height: 150, backgroundColor: 'rgba(79,116,125,.08)' },
  midCity: { position: 'absolute', left: 0, right: 0, top: '25%', height: 320 },
  ruin: { position: 'absolute', bottom: 0, backgroundColor: '#071015', borderWidth: 1, borderColor: '#13252D', transform: [{ rotate: '-2deg' }] },
  ruinBroken: { transform: [{ rotate: '4deg' }] },
  portalAnchor: { position: 'absolute', width: 150, height: 210, right: 18, top: '29%', alignItems: 'center', justifyContent: 'center' },
  portalGlow: { position: 'absolute', width: 140, height: 205, borderRadius: 75, backgroundColor: 'rgba(45,220,255,.10)', shadowColor: CYAN, shadowOpacity: .7, shadowRadius: 28 },
  portalRing: { width: 105, height: 178, borderRadius: 55, borderWidth: 4, borderColor: 'rgba(108,238,255,.7)' },
  portalCore: { position: 'absolute', width: 82, height: 148, borderRadius: 44, backgroundColor: 'rgba(5,72,92,.48)' },
  portalTouch: { position: 'absolute', right: 15, top: '29%', width: 155, height: 220, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 4 },
  portalLabel: { color: CYAN, fontSize: 8, fontWeight: '900', letterSpacing: 2.2, backgroundColor: 'rgba(2,7,10,.72)', paddingHorizontal: 9, paddingVertical: 5 },
  bossSilhouette: { position: 'absolute', left: 30, top: '30%', width: 105, height: 230, opacity: .82, alignItems: 'center' },
  bossHead: { width: 58, height: 55, borderRadius: 25, backgroundColor: '#020304', marginTop: 18 },
  bossBody: { width: 102, height: 170, borderTopLeftRadius: 45, borderTopRightRadius: 45, backgroundColor: '#020304', marginTop: -4 },
  bossHornLeft: { position: 'absolute', top: 0, left: 14, width: 7, height: 45, backgroundColor: '#020304', transform: [{ rotate: '-28deg' }] },
  bossHornRight: { position: 'absolute', top: 0, right: 14, width: 7, height: 45, backgroundColor: '#020304', transform: [{ rotate: '28deg' }] },
  bossEye: { position: 'absolute', top: 24, left: 13, width: 9, height: 3, backgroundColor: '#FF3B35', shadowColor: '#FF3B35', shadowOpacity: 1, shadowRadius: 7 },
  fireLeft: { position: 'absolute', left: 12, bottom: 180, width: 50, height: 80, alignItems: 'center', justifyContent: 'flex-end' },
  fireRight: { position: 'absolute', right: 24, bottom: 165, width: 42, height: 70, alignItems: 'center', justifyContent: 'flex-end' },
  fireGlow: { position: 'absolute', width: 78, height: 78, borderRadius: 39, backgroundColor: 'rgba(255,89,28,.12)' },
  fireGlyph: { color: FIRE, fontSize: 43, textShadowColor: FIRE, textShadowRadius: 14 },
  ember: { position: 'absolute', width: 3, height: 3, borderRadius: 2, backgroundColor: '#FFB14A', shadowColor: FIRE, shadowOpacity: .8, shadowRadius: 5 },
  rainLayer: { position: 'absolute', left: 0, right: 0, top: -120, height: 420 },
  rainDrop: { position: 'absolute', width: 1, backgroundColor: 'rgba(160,220,235,.62)', transform: [{ rotate: '12deg' }] },
  lightning: { backgroundColor: 'rgba(190,235,255,.18)' },
  foregroundFog: { position: 'absolute', left: -50, right: -50, bottom: 80, height: 180, backgroundColor: 'rgba(75,102,108,.07)', transform: [{ rotate: '-3deg' }] },
  ground: { position: 'absolute', left: -50, right: -50, bottom: -80, height: 260, backgroundColor: '#030607', transform: [{ rotate: '-2deg' }], borderTopWidth: 1, borderTopColor: '#17262B' },
  playerHero: { position: 'absolute', alignSelf: 'center', top: '26%', width: 190, height: 360, alignItems: 'center' },
  playerAura: { position: 'absolute', top: 20, width: 190, height: 290, borderRadius: 100, backgroundColor: 'rgba(22,183,215,.055)', shadowColor: CYAN, shadowOpacity: .28, shadowRadius: 28 },
  playerHead: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#071116', borderWidth: 2, borderColor: '#284650', alignItems: 'center', justifyContent: 'center', zIndex: 5, overflow: 'hidden' },
  faceless: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#0B171C', alignItems: 'center', justifyContent: 'center' },
  eyeLine: { width: 38, height: 2, backgroundColor: CYAN, shadowColor: CYAN, shadowOpacity: 1, shadowRadius: 8 },
  playerShoulders: { marginTop: -6, width: 168, height: 65, borderTopLeftRadius: 70, borderTopRightRadius: 70, backgroundColor: '#081116', borderWidth: 1, borderColor: '#213740' },
  playerBody: { marginTop: -32, width: 116, height: 170, backgroundColor: '#070E12', borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#1D343D', alignItems: 'center', paddingTop: 54 },
  chestCore: { width: 18, height: 18, borderWidth: 2, borderColor: CYAN, transform: [{ rotate: '45deg' }], shadowColor: CYAN, shadowOpacity: .8, shadowRadius: 9 },
  playerLegLeft: { position: 'absolute', bottom: 0, left: 57, width: 34, height: 105, backgroundColor: '#050A0D', transform: [{ rotate: '2deg' }] },
  playerLegRight: { position: 'absolute', bottom: 0, right: 57, width: 34, height: 105, backgroundColor: '#050A0D', transform: [{ rotate: '-2deg' }] },
  hud: { position: 'absolute', left: 15, right: 15, flexDirection: 'row', justifyContent: 'space-between', zIndex: 20 },
  levelHud: { width: 168, paddingTop: 4 },
  levelMicro: { color: 'rgba(220,245,250,.62)', fontSize: 8, fontWeight: '900', letterSpacing: 2.4 },
  levelValue: { color: '#FFF', fontSize: 38, lineHeight: 40, fontWeight: '900' },
  xpTrack: { width: 150, height: 4, borderRadius: 3, backgroundColor: 'rgba(108,238,255,.13)', overflow: 'hidden' },
  xpFill: { height: '100%', backgroundColor: CYAN },
  xpText: { color: CYAN, fontSize: 7, fontWeight: '800', marginTop: 4, letterSpacing: .8 },
  hudRight: { flexDirection: 'row', gap: 7 },
  hudPill: { minWidth: 64, height: 55, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(2,8,11,.45)', borderBottomWidth: 1, borderColor: 'rgba(108,238,255,.22)' },
  hudIcon: { position: 'absolute', left: 6, top: 7, color: CYAN, fontSize: 10 },
  hudValue: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  hudLabel: { color: 'rgba(220,245,250,.48)', fontSize: 6, fontWeight: '900', letterSpacing: 1.2 },
  worldNode: { position: 'absolute', zIndex: 12, alignItems: 'center', minWidth: 70 },
  nodeBeacon: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: 'rgba(108,238,255,.65)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(2,10,13,.7)' },
  nodeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: CYAN, shadowColor: CYAN, shadowOpacity: .9, shadowRadius: 7 },
  nodeLabel: { color: '#FFF', fontSize: 8, fontWeight: '900', letterSpacing: 1.7, marginTop: 5, backgroundColor: 'rgba(2,7,10,.64)', paddingHorizontal: 5 },
  nodeSub: { color: CYAN, fontSize: 8, fontWeight: '900', marginTop: 2 },
  nodeLocked: { opacity: .35 },
  nodePressed: { transform: [{ scale: .94 }] },
  dailyNode: { left: 15, top: '48%' },
  weeklyNode: { right: 20, top: '54%' },
  bossNode: { left: 24, top: '31%' },
  questCallout: { position: 'absolute', left: 14, right: 14, zIndex: 30, backgroundColor: 'rgba(2,8,11,.82)', borderLeftWidth: 3, borderLeftColor: CYAN, paddingVertical: 11, paddingHorizontal: 13, shadowColor: '#000', shadowOpacity: .6, shadowRadius: 14 },
  questEyebrow: { color: CYAN, fontSize: 7, fontWeight: '900', letterSpacing: 1.8 },
  questTitle: { color: '#FFF', fontSize: 20, lineHeight: 23, fontWeight: '900', marginTop: 4, maxWidth: '88%' },
  questProgressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  questProgressTrack: { flex: 1, height: 3, backgroundColor: 'rgba(108,238,255,.12)', overflow: 'hidden' },
  questProgressFill: { height: '100%', backgroundColor: CYAN },
  questProgressText: { color: 'rgba(220,245,250,.65)', fontSize: 7, fontWeight: '900', marginLeft: 8 },
  questAction: { marginTop: 9, minHeight: 38, backgroundColor: CYAN, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  questActionPressed: { opacity: .82, transform: [{ scale: .99 }] },
  questActionText: { color: '#001015', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  questReward: { color: '#00313A', fontSize: 8, fontWeight: '900' },
  worldState: { position: 'absolute', top: '14%', alignSelf: 'center', alignItems: 'center', zIndex: 10 },
  worldStateText: { color: 'rgba(190,238,246,.48)', fontSize: 6, fontWeight: '900', letterSpacing: 2 },
  playerName: { color: 'rgba(255,255,255,.62)', fontSize: 7, fontWeight: '800', marginTop: 4, letterSpacing: 1 },
  loadingRoot: { flex: 1, backgroundColor: '#020508', alignItems: 'center', justifyContent: 'center' },
  loadingSmall: { color: SYSTEM_COLORS.cyan, fontSize: 10, fontWeight: '900', letterSpacing: 4 },
  loadingTitle: { color: SYSTEM_COLORS.white, fontSize: 38, fontWeight: '900', marginTop: 12 },
});