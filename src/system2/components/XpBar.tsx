import { useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
} from 'react-native';

import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { SYSTEM_COLORS } from '../core';

type Props = {
  value: number;
  max: number;
};

export default function XpBar({
  value,
  max,
}: Props) {
  const target =
    max <= 0
      ? 0
      : Math.min(1, Math.max(0, value / max));

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(target, {
      duration: 750,
    });
  }, [progress, target]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.max(
      1.5,
      progress.value * 100
    )}%`,
  }));

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.label}>
          REAL XP
        </Text>

        <Text style={styles.value}>
          {value} / {max}
        </Text>
      </View>

      <View style={styles.track}>
        <Animated.View
          style={[styles.fill, fillStyle]}
        />

        <View style={styles.light} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  label: {
    color: SYSTEM_COLORS.textMuted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },

  value: {
    color: SYSTEM_COLORS.cyan,
    fontSize: 11,
    fontWeight: '900',
  },

  track: {
    height: 7,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#09252C',
  },

  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: SYSTEM_COLORS.cyan,
  },

  light: {
    position: 'absolute',
    height: 1,
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
});