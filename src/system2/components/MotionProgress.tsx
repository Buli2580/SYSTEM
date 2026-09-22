import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';

export default function MotionProgress({
  value,
  height = 7,
  track = '#09272D',
  fill = '#62efff',
  style,
}: {
  value: number;
  height?: number;
  track?: string;
  fill?: string;
  style?: ViewStyle;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const safe = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));

  useEffect(() => {
    Animated.spring(progress, {
      toValue: safe,
      damping: 16,
      stiffness: 120,
      mass: 0.7,
      useNativeDriver: false,
    }).start();
  }, [progress, safe]);

  return <View style={[styles.track, { height, backgroundColor: track }, style]}>
    <Animated.View
      style={{
        height: '100%',
        borderRadius: height,
        backgroundColor: fill,
        width: progress.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
      }}
    />
  </View>;
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden', borderRadius: 999 },
});
