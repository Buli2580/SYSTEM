import { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, { cancelAnimation, useSharedValue, useAnimatedStyle, withSequence, withTiming, withDelay } from 'react-native-reanimated';

export default function DiscoveryToast({ text, id }: { text: string | null; id: number }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!id) return;
    opacity.value = withSequence(
      withTiming(1, { duration: 180 }),
      withDelay(2200, withTiming(0, { duration: 350 }))
    );
    return () => cancelAnimation(opacity);
  }, [id, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: (1 - opacity.value) * -10 }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: 12,
          alignSelf: 'center',
          backgroundColor: 'rgba(9, 38, 47, 0.9)',
          borderWidth: 1,
          borderColor: 'rgba(98, 239, 255, 0.3)',
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 999,
          shadowColor: '#62efff',
          shadowOpacity: 0.15,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 0 },
        },
        style,
      ]}
    >
      <Text style={{ color: '#62efff', fontSize: 11, fontWeight: '900', letterSpacing: 1.6 }}>{text}</Text>
    </Animated.View>
  );
}
