import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SYSTEM_COLORS as C } from '../core';
import AnimatedCharacterBackdrop from '../presentation/AnimatedCharacterBackdrop';

type BootPhase = 'BLACK' | 'SIGNAL' | 'ENERGY' | 'INITIALIZING' | 'LOGO' | 'STATUS' | 'ONLINE' | 'COMPLETE';

interface SystemBootProps {
  onComplete: () => void;
  skipable?: boolean;
}

function SystemBoot({ onComplete, skipable = true }: SystemBootProps) {
  const [phase, setPhase] = useState<BootPhase>('BLACK');
  const [statusLines, setStatusLines] = useState<string[]>([]);

  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const scanlineOffset = useSharedValue(0);
  const signalIntensity = useSharedValue(0);
  const logoRotation = useSharedValue(0);

  useEffect(() => {
    let phaseIndex = 0;
    const phases: BootPhase[] = [
      'BLACK',
      'SIGNAL',
      'ENERGY',
      'INITIALIZING',
      'LOGO',
      'STATUS',
      'ONLINE',
      'COMPLETE'
    ];

    const runSequence = async () => {
      for (const p of phases) {
        if (p === 'BLACK') {
          setPhase(p);
          await delay(600);
        } else if (p === 'SIGNAL') {
          setPhase(p);
          signalIntensity.value = withRepeat(
            withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
            3,
            true
          );
          await delay(1200);
        } else if (p === 'ENERGY') {
          setPhase(p);
          signalIntensity.value = withTiming(0, { duration: 300 });
          await delay(800);
        } else if (p === 'INITIALIZING') {
          setPhase(p);
          setStatusLines([]);
          const initMessages = [
            'INITIALIZING CORE SYSTEMS...',
            'LOADING NEURAL INTERFACE...',
            'CALIBRATING GPS MODULE...',
            'SYNCING WITH ORBITAL NETWORK...',
            'VERIFYING CRYPTOGRAPHIC KEYS...',
            'ESTABLISHING SECURE CHANNEL...',
            'ALL SYSTEMS NOMINAL.',
          ];
          for (const msg of initMessages) {
            setStatusLines(prev => [...prev, msg]);
            await delay(250);
          }
          await delay(500);
        } else if (p === 'LOGO') {
          setPhase(p);
          logoScale.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.elastic(1)) });
          logoOpacity.value = withTiming(1, { duration: 400 });
          await delay(800);
        } else if (p === 'STATUS') {
          setPhase(p);
          textOpacity.value = withTiming(1, { duration: 600 });
          logoRotation.value = withRepeat(
            withTiming(1, { duration: 8000, easing: Easing.linear }),
            -1,
            false
          );
          await delay(1000);
        } else if (p === 'ONLINE') {
          setPhase(p);
          await delay(600);
        } else if (p === 'COMPLETE') {
          setPhase(p);
          await delay(300);
          onComplete();
          return;
        }
      }
    };

    runSequence();
  }, []);

  // Scanline animation
  useEffect(() => {
    scanlineOffset.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => {
    const rotate = `${logoRotation.value * 360}deg`;
    return {
      transform: [
        { scale: interpolate(logoScale.value, [0, 1], [0.5, 1]) },
        { rotate },
      ],
      opacity: logoOpacity.value,
    };
  });

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const scanlineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(scanlineOffset.value, [0, 1], [0, 100]) }],
    opacity: 0.03,
  }));

  const signalStyle = useAnimatedStyle(() => ({
    opacity: signalIntensity.value,
  }));

  const logoGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(signalIntensity.value, [0, 1], [0.3, 0.8]),
  }));

  return (
    <View style={styles.container}>
      <AnimatedCharacterBackdrop scene="AWAKENING" opacity={0.52} />
      <Animated.View style={[styles.scanlineOverlay, scanlineStyle]} />
      
      <Animated.View style={[styles.signalLayer, signalStyle]}>
        <View style={styles.signalRing} />
        <View style={styles.signalCore} />
      </Animated.View>

      <Animated.View style={logoStyle}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>SYSTEM</Text>
          <Text style={styles.logoSubtext}>2.0</Text>
        </View>
        <Animated.Text style={[styles.logoSubtextSmall, textStyle]}>REAL-LIFE RPG</Animated.Text>
      </Animated.View>

      <Animated.View style={[styles.statusContainer, textStyle]}>
        {phase === 'INITIALIZING' && (
          <>
            <Text style={styles.statusTitle}>INITIALIZING...</Text>
            {statusLines.map((line, i) => (
              <Animated.Text
                key={i}
                style={[
                  styles.statusLine,
                  { opacity: i < statusLines.length - 1 ? 1 : interpolate(logoScale.value, [0, 1], [0, 1]) }
                ]}
              >
                {line}
              </Animated.Text>
            ))}
          </>
        )}
        {phase === 'STATUS' && (
          <>
            <Text style={styles.statusTitle}>SYSTEM STATUS</Text>
            <Text style={styles.statusLine}>NEURAL INTERFACE: CONNECTED</Text>
            <Text style={styles.statusLine}>GPS MODULE: CALIBRATED</Text>
            <Text style={styles.statusLine}>ORBITAL LINK: ESTABLISHED</Text>
            <Text style={styles.statusLine}>CRYPTO KEYS: VERIFIED</Text>
            <Text style={styles.statusLine}>SECURE CHANNEL: ACTIVE</Text>
          </>
        )}
        {phase === 'ONLINE' && (
          <>
            <Text style={[styles.statusTitle, { color: '#00ff88' }]}>SYSTEM ONLINE</Text>
            <Text style={styles.statusLine}>ALL SYSTEMS OPERATIONAL</Text>
          </>
        )}
      </Animated.View>

      {skipable && (
        <Pressable
          style={({ pressed }) => [
            styles.skipButton,
            pressed && { opacity: 0.7 }
          ]}
          onPress={() => {
            setPhase('COMPLETE');
            onComplete();
          }}
        >
          <Text style={styles.skipText}>SKIP</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanlineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: 10,
  },
  signalLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  signalRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#00e5ff',
  },
  signalCore: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#00e5ff',
  },
  logoContainer: {
    alignItems: 'center',
    gap: 4,
  },
  logoText: {
    color: '#00e5ff',
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 8,
    fontFamily: 'monospace',
  },
  logoSubtext: {
    color: '#00e5ff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 12,
    fontFamily: 'monospace',
  },
  logoSubtextSmall: {
    color: '#00e5ff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 6,
    fontFamily: 'monospace',
    marginTop: 8,
  },
  statusContainer: {
    marginTop: 32,
    alignItems: 'center',
    gap: 8,
    width: '80%',
  },
  statusTitle: {
    color: '#00e5ff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 4,
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  statusLine: {
    color: '#6ceeff',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    fontFamily: 'monospace',
    textAlign: 'left',
    width: '100%',
  },
  skipButton: {
    position: 'absolute',
    bottom: 40,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1a3a3a',
    backgroundColor: 'rgba(0,229,255,0.05)',
  },
  skipText: {
    color: '#6ceeff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
});

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default SystemBoot;