import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

import {
    Canvas,
    Circle,
    RadialGradient,
    vec,
} from '@shopify/react-native-skia';

import { SYSTEM_COLORS } from '../core';

type Props = {
  size?: number;
};

export default function SystemAura({
  size = 220,
}: Props) {
  const rotation = useSharedValue(0);
  const reverseRotation = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
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

    pulse.value = withRepeat(
      withTiming(1, {
        duration: 1800,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, [pulse, reverseRotation, rotation]);

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${rotation.value * 360}deg`,
      },
    ],
  }));

  const reverseStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${reverseRotation.value * -360}deg`,
      },
    ],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      pulse.value,
      [0, 1],
      [0.35, 0.8]
    ),

    transform: [
      {
        scale: interpolate(
          pulse.value,
          [0, 1],
          [0.94, 1.06]
        ),
      },
    ],
  }));

  return (
    <View
      style={[
        styles.root,
        {
          width: size,
          height: size,
        },
      ]}
    >
      <Canvas style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={size * 0.48}
        >
          <RadialGradient
            c={vec(size / 2, size / 2)}
            r={size * 0.48}
            colors={[
              'rgba(0,229,255,0.16)',
              'rgba(0,229,255,0.035)',
              'rgba(0,0,0,0)',
            ]}
          />
        </Circle>
      </Canvas>

      <Animated.View
        style={[
          styles.pulseRing,
          {
            width: size * 0.94,
            height: size * 0.94,
            borderRadius: size,
          },
          pulseStyle,
        ]}
      />

      <Animated.View
        style={[
          styles.ringOuter,
          {
            width: size * 0.82,
            height: size * 0.82,
            borderRadius: size,
          },
          rotateStyle,
        ]}
      >
        <View style={styles.nodeLarge} />
        <View style={styles.nodeSmall} />
      </Animated.View>

      <Animated.View
        style={[
          styles.ringInner,
          {
            width: size * 0.62,
            height: size * 0.62,
            borderRadius: size,
          },
          reverseStyle,
        ]}
      >
        <View style={styles.innerNode} />
      </Animated.View>

      <View
        style={[
          styles.core,
          {
            width: size * 0.37,
            height: size * 0.37,
            borderRadius: size,
          },
        ]}
      >
        <View
          style={[
            styles.diamondOuter,
            {
              width: size * 0.18,
              height: size * 0.18,
            },
          ]}
        >
          <View style={styles.diamondInner} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  pulseRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.18)',
  },

  ringOuter: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.55)',
  },

  ringInner: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.35)',
  },

  nodeLarge: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: SYSTEM_COLORS.cyan,
    top: -5,
    left: '48%',
  },

  nodeSmall: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: SYSTEM_COLORS.cyanSoft,
    bottom: -3,
    left: '48%',
  },

  innerNode: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: SYSTEM_COLORS.cyan,
    right: -4,
    top: '47%',
  },

  core: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,229,255,0.035)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.18)',
  },

  diamondOuter: {
    borderWidth: 3,
    borderColor: SYSTEM_COLORS.cyan,
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },

  diamondInner: {
    width: '34%',
    height: '34%',
    backgroundColor: SYSTEM_COLORS.cyan,
  },
});