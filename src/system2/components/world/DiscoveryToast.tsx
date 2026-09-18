import { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming, withDelay } from 'react-native-reanimated';

export default function DiscoveryToast({ text, id }: { text: string | null; id: number }) {
  const opacity = useSharedValue(0);
  useEffect(() => { if (id) opacity.value = withSequence(withTiming(1, { duration: 180 }), withDelay(2200, withTiming(0, { duration: 350 }))); }, [id, opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: (1 - opacity.value) * -10 }] }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 12, alignSelf: 'center', backgroundColor: '#09262f', padding: 12, borderRadius: 8 }, style]}>
    <Text style={{ color: '#62efff', fontSize: 11, fontWeight: '900' }}>{text}</Text>
  </Animated.View>;
}
