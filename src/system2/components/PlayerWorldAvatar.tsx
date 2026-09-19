// SYSTEM 2.0 - Player World Avatar
// Player representation on the world map

import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, interpolate, Easing } from 'react-native-reanimated';
import { SYSTEM_COLORS as C } from '../core';

interface PlayerWorldAvatarProps {
  fix: { coords: { latitude: number; longitude: number; accuracy?: number; heading?: number } } | null;
  heading?: number;
  tracking: boolean;
  accuracy?: number;
  size?: number;
}

export default function PlayerWorldAvatar({ fix, heading, tracking, accuracy, size = 28 }: PlayerWorldAvatarProps) {
  const pulse = useSharedValue(0);
  const rotation = useSharedValue(0);
  const [pulseAnim] = useState(() => pulse);
  const [rotationAnim] = useState(() => rotation);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: tracking ? 1200 : 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    
    if (fix && heading !== undefined) {
      rotation.value = withTiming(heading, { duration: 300 });
    }
  }, [fix, heading, tracking]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.9, 1.15]) }],
    opacity: interpolate(pulse.value, [0, 1], [0.4, 0.9]),
  }));

  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const accuracyStyle = useAnimatedStyle(() => ({
    width: interpolate(accuracy ?? 0, [0, 50], [0, 80]),
    height: interpolate(accuracy ?? 0, [0, 50], [0, 80]),
    borderRadius: interpolate(accuracy ?? 0, [0, 50], [0, 40]),
    opacity: interpolate(accuracy ?? 0, [0, 10, 50], [0, 0.15, 0.25]),
    transform: [{ scale: interpolate(accuracy ?? 0, [0, 50], [1, 1.5]) }],
  }), [accuracy]);

  if (!fix) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Animated.View style={[styles.pulseRing, pulseStyle]} />
        <View style={styles.core}>
          <Text style={styles.coreText}>?</Text>
        </View>
        <Text style={styles.label}>NO FIX</Text>
      </View>
    );
  }

  const accuracyValue = fix.coords.accuracy ?? 0;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {tracking && <Animated.View style={[styles.pulseRing, pulseStyle]} />}
      
      {(accuracy ?? 0) > 0 && (
        <Animated.View style={[styles.accuracyCircle, accuracyStyle]} />
      )}
      
      <Animated.View style={[styles.core, rotationStyle, { width: size, height: size }]}>
        <View style={styles.coreInner}>
          <Text style={styles.coreText}>●</Text>
        </View>
      </Animated.View>

      <View style={styles.label}>
        <Text style={styles.labelText}>PLAYER</Text>
        <Text style={styles.accuracyText}>±{Math.round(accuracyValue)}m</Text>
      </View>

      <Animated.View style={[styles.headingArrow, rotationStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#00e5ff',
  },
  accuracyCircle: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#00e5ff',
    backgroundColor: 'rgba(0,229,255,0.05)',
  },
  core: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#00e5ff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  coreInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  coreText: {
    color: '#001014',
    fontSize: 10,
    fontWeight: '900',
  },
  label: {
    marginTop: 6,
    alignItems: 'center',
    gap: 2,
  },
  labelText: {
    color: '#62efff',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  accuracyText: {
    color: '#91a5b2',
    fontSize: 7,
    fontWeight: '600',
  },
  headingArrow: {
    position: 'absolute',
    bottom: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#00e5ff',
  },
});