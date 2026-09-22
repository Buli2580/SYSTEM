import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SYSTEM_COLORS as C } from '../core';

type Status = 'CHECKING' | 'READY' | 'STARTING' | 'TRACKING' | 'COMPLETING' | 'COMPLETED' | 'DENIED' | 'ERROR' | 'LOCKED';

const phases = ['BRIEFING', 'START', 'ACTIVE', 'VERIFYING', 'REWARD'] as const;

function indexFor(status: Status) {
  if (status === 'READY' || status === 'CHECKING' || status === 'LOCKED') return 0;
  if (status === 'STARTING') return 1;
  if (status === 'TRACKING') return 2;
  if (status === 'COMPLETING') return 3;
  if (status === 'COMPLETED') return 4;
  return 0;
}

export default function QuestFlowHeader({ status, boss = false }: { status: Status; boss?: boolean }) {
  const active = indexFor(status);
  const pulse = useSharedValue(0);
  const rotation = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: boss ? 650 : 1100 }), -1, true);
    rotation.value = withRepeat(withTiming(1, { duration: boss ? 4200 : 9000 }), -1, false);
  }, [boss, pulse, rotation]);
  const core = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.35, 1]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.86, 1.12]) }],
  }));
  const bossEmblem = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.45, 1]),
    transform: [{ rotate: `${rotation.value * 360}deg` }, { scale: interpolate(pulse.value, [0, 1], [0.9, 1.08]) }],
  }));
  return <Animated.View entering={FadeInDown.duration(420)} style={[styles.root, boss && styles.boss]}>
    <View style={styles.header}>
      {boss ? <Animated.View style={[styles.bossEmblem, bossEmblem]}><View style={styles.bossEmblemInner} /></Animated.View> : <Animated.View style={[styles.core, core]} />}
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, boss && styles.bossText]}>{boss ? 'BOSS DETECTED // COMBAT PROTOCOL' : 'QUEST EXPERIENCE 2.1'}</Text>
        {boss && <Text style={styles.bossSub}>THREAT SIGNAL LOCKED</Text>}
      </View>
    </View>
    <View style={styles.phases}>
      {phases.map((phase, index) => <View key={phase} style={styles.phase}>
        <View style={[styles.dot, index <= active && styles.dotActive, boss && index <= active && styles.bossDot]} />
        <Text style={[styles.label, index === active && styles.labelActive, boss && index === active && styles.bossText]}>{phase}</Text>
      </View>)}
    </View>
  </Animated.View>;
}

const styles = StyleSheet.create({
  root: { borderWidth: 1, borderColor: C.line, backgroundColor: '#041014', borderRadius: 20, padding: 16, marginBottom: 14 },
  boss: { borderColor: '#8b3c34', backgroundColor: '#140807' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  core: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.cyan, marginRight: 9 },
  bossCore: { backgroundColor: '#ff6d5c' },
  bossEmblem: { width: 28, height: 28, borderWidth: 2, borderColor: '#ff6d5c', transform: [{ rotate: '45deg' }], marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  bossEmblemInner: { width: 8, height: 8, backgroundColor: '#ff6d5c' },
  bossSub: { color: '#8d5550', fontSize: 6, fontWeight: '900', letterSpacing: 2, marginTop: 4 },
  title: { color: C.cyan, fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  bossText: { color: '#ff8b7e' },
  phases: { flexDirection: 'row', justifyContent: 'space-between' },
  phase: { flex: 1, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#18353e', marginBottom: 7 },
  dotActive: { backgroundColor: C.cyan },
  bossDot: { backgroundColor: '#ff6d5c' },
  label: { color: '#4d6670', fontSize: 6, fontWeight: '900', letterSpacing: 0.6 },
  labelActive: { color: '#dffcff' },
});
