import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SYSTEM_COLORS as C } from '../core';
import { presentationEventBus } from '../presentation/PresentationEvents';

export type CharacterScene =
  | 'HOME'
  | 'CHARACTER'
  | 'WORLD'
  | 'QUEST'
  | 'TRAINING_STRENGTH'
  | 'TRAINING_CARDIO'
  | 'FOCUS'
  | 'RECOVERY'
  | 'AI_GAME_MASTER'
  | 'BOSS'
  | 'AWAKENING'
  | 'VICTORY'
  | 'FAILURE';

type Props = {
  scene: CharacterScene;
  opacity?: number;
  compact?: boolean;
};

function transientScene(type: string): CharacterScene | null {
  if (type === 'QUEST_COMPLETE' || type === 'LEVEL_UP' || type === 'BOSS_DEFEATED') return 'VICTORY';
  if (type === 'QUEST_FAILED' || type === 'SYSTEM_ERROR') return 'FAILURE';
  if (type === 'BOSS_APPEARED' || type === 'BOSS_PHASE_CHANGED') return 'BOSS';
  if (type === 'AWAKENING_STARTED') return 'AWAKENING';
  return null;
}

export function sceneForPath(pathname: string): CharacterScene {
  if (pathname.startsWith('/game-master')) return 'AI_GAME_MASTER';
  if (pathname.startsWith('/character')) return 'CHARACTER';
  if (pathname.startsWith('/world') || pathname.startsWith('/explore')) return 'WORLD';
  if (pathname.startsWith('/quest')) return 'QUEST';
  if (pathname.startsWith('/raids')) return 'BOSS';
  return 'HOME';
}

export default function AnimatedCharacterBackdrop({ scene, opacity = 0.34, compact = false }: Props) {
  const [override, setOverride] = useState<CharacterScene | null>(null);
  const active = override ?? scene;
  const breath = useSharedValue(0);
  const drift = useSharedValue(0);
  const pulse = useSharedValue(0);
  const transientTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    breath.value = withRepeat(
      withTiming(1, { duration: active === 'TRAINING_CARDIO' ? 720 : 2200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    drift.value = withRepeat(
      withTiming(1, { duration: active === 'WORLD' ? 5200 : 7600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [active, breath, drift]);

  useEffect(() => {
    const unsubscribe = presentationEventBus.onAny(event => {
      const next = transientScene(event.type);
      if (!next) return;
      if (transientTimerRef.current) clearTimeout(transientTimerRef.current);
      setOverride(next);
      pulse.value = 0;
      pulse.value = withSequence(
        withTiming(1, { duration: 180 }),
        withTiming(0, { duration: 700 }),
      );
      transientTimerRef.current = setTimeout(() => {
        transientTimerRef.current = null;
        setOverride(null);
      }, next === 'AWAKENING' ? 5200 : 1900);
    });
    return () => {
      unsubscribe();
      if (transientTimerRef.current) clearTimeout(transientTimerRef.current);
      transientTimerRef.current = null;
    };
  }, [pulse]);

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: breath.value * (active === 'TRAINING_CARDIO' ? 7 : 4) },
      { translateX: (drift.value - 0.5) * (active === 'WORLD' ? 18 : 5) },
      { scale: 1 + breath.value * (active === 'BOSS' ? 0.018 : 0.009) },
    ],
  }));

  const auraStyle = useAnimatedStyle(() => ({
    opacity: 0.18 + breath.value * 0.12 + pulse.value * 0.38,
    transform: [{ scale: 0.96 + breath.value * 0.05 + pulse.value * 0.08 }],
  }));

  const scanStyle = useAnimatedStyle(() => ({
    opacity: 0.12 + drift.value * 0.08,
    transform: [{ translateY: (drift.value - 0.5) * 140 }],
  }));

  const pose = useMemo(() => poseFor(active), [active]);
  const rootOpacity = compact ? Math.min(opacity, 0.28) : opacity;

  return (
    <View pointerEvents="none" style={[styles.root, { opacity: rootOpacity }]}>
      <Animated.View style={[styles.aura, active === 'BOSS' && styles.auraDanger, auraStyle]} />
      {active === 'AI_GAME_MASTER' && <View style={styles.holoPanel} />}
      {active === 'WORLD' && <View style={styles.worldArc} />}
      {active === 'BOSS' && <EnemySilhouette />}
      <Animated.View style={[styles.hero, compact && styles.heroCompact, bodyStyle]}>
        <View style={[styles.head, pose.head]} />
        <View style={[styles.neck, pose.neck]} />
        <View style={[styles.torso, pose.torso]} />
        <View style={[styles.arm, styles.leftArm, pose.leftArm]} />
        <View style={[styles.arm, styles.rightArm, pose.rightArm]} />
        <View style={[styles.leg, styles.leftLeg, pose.leftLeg]} />
        <View style={[styles.leg, styles.rightLeg, pose.rightLeg]} />
        {(active === 'QUEST' || active === 'BOSS' || active === 'VICTORY') && <View style={[styles.energyBlade, active === 'BOSS' && styles.energyBladeDanger]} />}
        {active === 'TRAINING_STRENGTH' && <StrengthBar />}
      </Animated.View>
      <Animated.View style={[styles.scan, scanStyle]} />
      {active === 'VICTORY' && <VictoryBurst />}
      {active === 'FAILURE' && <View style={styles.failureShade} />}
    </View>
  );
}

function poseFor(scene: CharacterScene) {
  const base = {
    head: {},
    neck: {},
    torso: {},
    leftArm: {},
    rightArm: {},
    leftLeg: {},
    rightLeg: {},
  };

  if (scene === 'TRAINING_STRENGTH') return {
    ...base,
    torso: { transform: [{ rotate: '-2deg' }] },
    leftArm: { transform: [{ rotate: '-132deg' }], top: 67, left: 61 },
    rightArm: { transform: [{ rotate: '132deg' }], top: 67, right: 61 },
    leftLeg: { transform: [{ rotate: '7deg' }] },
    rightLeg: { transform: [{ rotate: '-7deg' }] },
  };
  if (scene === 'TRAINING_CARDIO' || scene === 'WORLD') return {
    ...base,
    torso: { transform: [{ rotate: '9deg' }] },
    leftArm: { transform: [{ rotate: '-48deg' }], top: 91, left: 45 },
    rightArm: { transform: [{ rotate: '54deg' }], top: 80, right: 44 },
    leftLeg: { transform: [{ rotate: '20deg' }], left: 73 },
    rightLeg: { transform: [{ rotate: '-25deg' }], right: 70 },
  };
  if (scene === 'FOCUS' || scene === 'RECOVERY') return {
    ...base,
    torso: { transform: [{ scaleY: 0.92 }] },
    leftArm: { transform: [{ rotate: '-76deg' }], top: 101, left: 49 },
    rightArm: { transform: [{ rotate: '76deg' }], top: 101, right: 49 },
    leftLeg: { transform: [{ rotate: '33deg' }], left: 75, top: 170 },
    rightLeg: { transform: [{ rotate: '-33deg' }], right: 75, top: 170 },
  };
  if (scene === 'BOSS') return {
    ...base,
    torso: { transform: [{ rotate: '-7deg' }, { scaleX: 1.08 }] },
    leftArm: { transform: [{ rotate: '-58deg' }], top: 83, left: 42 },
    rightArm: { transform: [{ rotate: '35deg' }], top: 73, right: 44 },
    leftLeg: { transform: [{ rotate: '12deg' }] },
    rightLeg: { transform: [{ rotate: '-16deg' }] },
  };
  if (scene === 'VICTORY' || scene === 'AWAKENING') return {
    ...base,
    leftArm: { transform: [{ rotate: '-145deg' }], top: 64, left: 57 },
    rightArm: { transform: [{ rotate: '145deg' }], top: 64, right: 57 },
    torso: { transform: [{ scaleX: 1.05 }] },
  };
  if (scene === 'FAILURE') return {
    ...base,
    head: { transform: [{ translateY: 9 }, { rotate: '13deg' }] },
    torso: { transform: [{ rotate: '8deg' }] },
    leftArm: { transform: [{ rotate: '-18deg' }] },
    rightArm: { transform: [{ rotate: '28deg' }] },
  };
  if (scene === 'AI_GAME_MASTER') return {
    ...base,
    torso: { transform: [{ scaleX: 0.96 }] },
    leftArm: { transform: [{ rotate: '-18deg' }] },
    rightArm: { transform: [{ rotate: '64deg' }], top: 87, right: 47 },
  };
  return base;
}

function EnemySilhouette() {
  return <View style={styles.enemy}>
    <View style={styles.enemyAura} />
    <View style={styles.enemyHead} />
    <View style={styles.enemyTorso} />
    <View style={[styles.enemyHorn, { transform: [{ rotate: '-24deg' }], left: 24 }]} />
    <View style={[styles.enemyHorn, { transform: [{ rotate: '24deg' }], right: 24 }]} />
  </View>;
}

function StrengthBar() {
  return <View style={styles.barbell}>
    <View style={styles.bar} />
    <View style={[styles.weight, { left: -8 }]} />
    <View style={[styles.weight, { right: -8 }]} />
  </View>;
}

function VictoryBurst() {
  return <View style={styles.burst}>
    {[-52, -26, 0, 26, 52].map(angle => <View key={angle} style={[styles.ray, { transform: [{ rotate: `${angle}deg` }] }]} />)}
  </View>;
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  aura: { position: 'absolute', width: 310, height: 310, borderRadius: 155, borderWidth: 1, borderColor: C.cyan, backgroundColor: 'rgba(42,220,255,0.10)' },
  auraDanger: { borderColor: C.danger, backgroundColor: 'rgba(255,44,84,0.10)' },
  hero: { width: 220, height: 310, position: 'absolute', bottom: -12, alignItems: 'center' },
  heroCompact: { transform: [{ scale: 0.82 }], bottom: -42 },
  head: { position: 'absolute', top: 26, width: 48, height: 52, borderRadius: 22, backgroundColor: '#07151a', borderWidth: 1, borderColor: 'rgba(108,238,255,0.45)', zIndex: 5 },
  neck: { position: 'absolute', top: 72, width: 22, height: 24, backgroundColor: '#07151a' },
  torso: { position: 'absolute', top: 86, width: 92, height: 118, borderTopLeftRadius: 35, borderTopRightRadius: 35, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, backgroundColor: '#061116', borderWidth: 1, borderColor: 'rgba(108,238,255,0.35)' },
  arm: { position: 'absolute', top: 93, width: 25, height: 126, borderRadius: 14, backgroundColor: '#061116', borderWidth: 1, borderColor: 'rgba(108,238,255,0.28)', transformOrigin: 'top center' },
  leftArm: { left: 51, transform: [{ rotate: '10deg' }] },
  rightArm: { right: 51, transform: [{ rotate: '-10deg' }] },
  leg: { position: 'absolute', top: 193, width: 31, height: 132, borderRadius: 16, backgroundColor: '#061116', borderWidth: 1, borderColor: 'rgba(108,238,255,0.25)', transformOrigin: 'top center' },
  leftLeg: { left: 75, transform: [{ rotate: '4deg' }] },
  rightLeg: { right: 75, transform: [{ rotate: '-4deg' }] },
  energyBlade: { position: 'absolute', width: 5, height: 116, borderRadius: 4, backgroundColor: C.cyan, right: 28, top: 118, transform: [{ rotate: '-24deg' }], shadowColor: C.cyan, shadowOpacity: 0.8, shadowRadius: 12 },
  energyBladeDanger: { backgroundColor: C.danger, shadowColor: C.danger },
  scan: { position: 'absolute', width: '90%', height: 1, backgroundColor: C.cyan, top: '50%' },
  holoPanel: { position: 'absolute', width: 250, height: 160, borderWidth: 1, borderColor: 'rgba(108,238,255,0.35)', borderRadius: 24, transform: [{ rotate: '-7deg' }], backgroundColor: 'rgba(0,30,38,0.10)' },
  worldArc: { position: 'absolute', width: 390, height: 190, borderTopWidth: 1, borderColor: 'rgba(108,238,255,0.25)', borderRadius: 195, bottom: 42 },
  enemy: { position: 'absolute', right: -12, top: 64, width: 150, height: 240, opacity: 0.65 },
  enemyAura: { position: 'absolute', width: 190, height: 190, borderRadius: 95, backgroundColor: 'rgba(255,43,78,0.12)', left: -22, top: 12 },
  enemyHead: { position: 'absolute', width: 44, height: 48, borderRadius: 18, backgroundColor: '#17070b', left: 53, top: 38, borderWidth: 1, borderColor: 'rgba(255,64,96,0.4)' },
  enemyTorso: { position: 'absolute', width: 98, height: 145, borderRadius: 34, backgroundColor: '#13070a', left: 26, top: 79, borderWidth: 1, borderColor: 'rgba(255,64,96,0.3)' },
  enemyHorn: { position: 'absolute', width: 8, height: 48, backgroundColor: '#1b080c', top: 14, borderRadius: 4 },
  barbell: { position: 'absolute', top: 46, width: 190, height: 18, alignItems: 'center', justifyContent: 'center' },
  bar: { width: 178, height: 5, backgroundColor: C.textMuted, borderRadius: 3 },
  weight: { position: 'absolute', width: 17, height: 32, backgroundColor: '#17343c', borderWidth: 1, borderColor: C.cyan, borderRadius: 4 },
  burst: { position: 'absolute', width: 260, height: 260, alignItems: 'center', justifyContent: 'center' },
  ray: { position: 'absolute', width: 2, height: 230, backgroundColor: 'rgba(108,238,255,0.22)' },
  failureShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(60,0,12,0.12)' },
});
