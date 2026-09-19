import { useFocusEffect } from 'expo-router';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { SYSTEM_COLORS as C } from '../core';

type Intensity = 'quiet' | 'default' | 'hero' | 'world';

export default function SystemAmbientBackground({ intensity = 'default' }: { intensity?: Intensity }) {
  const drift = useSharedValue(0);
  const scan = useSharedValue(0);

  useFocusEffect(useCallback(() => {
    drift.value = withRepeat(
      withTiming(1, { duration: 14000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    scan.value = withRepeat(
      withTiming(1, { duration: 11000, easing: Easing.linear }),
      -1,
      false
    );
    return () => {
      cancelAnimation(drift);
      cancelAnimation(scan);
    };
  }, [drift, scan]));

  const driftStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: drift.value * 12 },
      { translateY: drift.value * -8 },
      { rotate: `${drift.value * 2}deg` },
    ],
  }));
  const scanStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: `${scan.value * 120 - 60}%` }],
    opacity: 0.18 + scan.value * 0.08,
  }));

  const strength = intensity === 'hero' ? 1 : intensity === 'world' ? 0.9 : intensity === 'quiet' ? 0.45 : 0.7;

  return <View pointerEvents="none" style={styles.root}>
    <Animated.View style={[styles.glowLarge, { opacity: 0.08 * strength }, driftStyle]} />
    <Animated.View style={[styles.glowSmall, { opacity: 0.06 * strength }, driftStyle]} />
    <Animated.View style={[styles.plane, { opacity: 0.035 * strength }, driftStyle]} />
    <View style={[styles.cornerFrame, { opacity: 0.18 * strength }]} />
    <View style={[styles.grid, { opacity: 0.08 * strength }]} />
    {intensity === 'world' && <>
      <View style={[styles.networkLine, styles.networkLineOne, { opacity: 0.22 * strength }]} />
      <View style={[styles.networkLine, styles.networkLineTwo, { opacity: 0.18 * strength }]} />
      <View style={[styles.networkNode, styles.nodeOne, { opacity: 0.42 * strength }]} />
      <View style={[styles.networkNode, styles.nodeTwo, { opacity: 0.32 * strength }]} />
      <View style={[styles.networkNode, styles.nodeThree, { opacity: 0.24 * strength }]} />
      <View style={[styles.worldLock, { opacity: 0.26 * strength }]} />
    </>}
    {intensity !== 'quiet' && <Animated.View style={[styles.scanLine, { opacity: 0.16 * strength }, scanStyle]} />}
  </View>;
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  glowLarge: { position: 'absolute', width: 330, height: 330, borderRadius: 165, backgroundColor: C.cyan, top: -125, right: -130 },
  glowSmall: { position: 'absolute', width: 210, height: 210, borderRadius: 105, backgroundColor: C.cyanSoft, bottom: 90, left: -150 },
  plane: { position: 'absolute', width: '150%', height: 180, backgroundColor: C.cyanDark, top: '35%', left: '-25%', transform: [{ rotate: '-18deg' }] },
  cornerFrame: { position: 'absolute', width: 190, height: 190, borderWidth: 1, borderColor: C.cyan, borderRadius: 95, top: -105, left: -90 },
  grid: { position: 'absolute', width: '135%', height: 1, backgroundColor: C.cyan, top: '24%', left: '-18%', transform: [{ rotate: '24deg' }] },
  scanLine: { position: 'absolute', height: 1, width: '130%', backgroundColor: C.cyan, left: '-15%', top: '50%' },
  networkLine: { position: 'absolute', height: 1, backgroundColor: C.cyan, transformOrigin: 'left center' },
  networkLineOne: { width: '70%', top: '34%', left: '12%', transform: [{ rotate: '18deg' }] },
  networkLineTwo: { width: '58%', top: '63%', left: '30%', transform: [{ rotate: '-28deg' }] },
  networkNode: { position: 'absolute', width: 8, height: 8, borderRadius: 4, borderWidth: 1, borderColor: C.cyan, backgroundColor: C.background },
  nodeOne: { top: '31%', left: '10%' },
  nodeTwo: { top: '47%', right: '18%' },
  nodeThree: { bottom: '20%', left: '28%' },
  worldLock: { position: 'absolute', width: 112, height: 112, borderRadius: 56, borderWidth: 1, borderColor: C.cyan, top: '39%', left: '50%', marginLeft: -56 },
});
