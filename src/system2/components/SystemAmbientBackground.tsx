import { useEffect, useRef, useState } from 'react';
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
  LinearGradient,
  Rect,
  vec,
  Group,
} from '@shopify/react-native-skia';
import { useWindowDimensions } from 'react-native';
import { SYSTEM_COLORS as C } from '../core';

export type AmbientMode = 'CALM' | 'ACTIVE' | 'QUEST' | 'WARNING' | 'BOSS' | 'VICTORY';

interface SystemAmbientBackgroundProps {
  mode?: AmbientMode;
  intensity?: number;
  children?: React.ReactNode;
}

const MODE_CONFIGS: Record<AmbientMode, {
  primaryColor: string;
  secondaryColor: string;
  particleCount: number;
  pulseSpeed: number;
  glowIntensity: number;
  scanlineOpacity: number;
  particleSpeed: number;
}> = {
  CALM: {
    primaryColor: '#00e5ff',
    secondaryColor: '#00a3cc',
    particleCount: 15,
    pulseSpeed: 3000,
    glowIntensity: 0.15,
    scanlineOpacity: 0.02,
    particleSpeed: 0.3,
  },
  ACTIVE: {
    primaryColor: '#00e5ff',
    secondaryColor: '#00ccff',
    particleCount: 25,
    pulseSpeed: 2000,
    glowIntensity: 0.25,
    scanlineOpacity: 0.04,
    particleSpeed: 0.5,
  },
  QUEST: {
    primaryColor: '#00e5ff',
    secondaryColor: '#00ff88',
    particleCount: 30,
    pulseSpeed: 1500,
    glowIntensity: 0.3,
    scanlineOpacity: 0.06,
    particleSpeed: 0.7,
  },
  WARNING: {
    primaryColor: '#ffb400',
    secondaryColor: '#ff8800',
    particleCount: 40,
    pulseSpeed: 800,
    glowIntensity: 0.4,
    scanlineOpacity: 0.08,
    particleSpeed: 1.0,
  },
  BOSS: {
    primaryColor: '#ff4444',
    secondaryColor: '#ff0000',
    particleCount: 50,
    pulseSpeed: 500,
    glowIntensity: 0.5,
    scanlineOpacity: 0.1,
    particleSpeed: 1.5,
  },
  VICTORY: {
    primaryColor: '#00ff88',
    secondaryColor: '#00ffcc',
    particleCount: 60,
    pulseSpeed: 1000,
    glowIntensity: 0.4,
    scanlineOpacity: 0.05,
    particleSpeed: 0.8,
  },
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
}

function SystemAmbientBackground({
  mode = 'CALM',
  intensity = 1,
  children,
}: SystemAmbientBackgroundProps) {
  const { width, height } = useWindowDimensions();
  const [currentMode, setCurrentMode] = useState<AmbientMode>(mode);
  
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  
  const pulse = useSharedValue(0);
  const scanlineOffset = useSharedValue(0);
  const timeRef = useSharedValue(0);
  const modeTransitionRef = useSharedValue(0);

  // Sync mode changes
  useEffect(() => {
    setCurrentMode(mode);
    // Trigger mode transition animation
    modeTransitionRef.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
    setTimeout(() => {
      modeTransitionRef.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) });
    }, 800);
  }, [mode]);

  // Initialize particles
  useEffect(() => {
    const config = MODE_CONFIGS[currentMode];
    const count = Math.floor(config.particleCount * intensity);
    particlesRef.current = Array.from({ length: count }, () => createParticle(width, height, config));
  }, [currentMode, intensity, width, height]);

  // Animation loop
  useEffect(() => {
    let lastTime = performance.now();
    
    const animate = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      
      const config = MODE_CONFIGS[currentMode];
      
      // Update time uniform
      timeRef.value = (timeRef.value + dt) % 10000;
      
      // Update scanline
      scanlineOffset.value = (scanlineOffset.value + dt * 0.1) % 1;
      
      // Update particles
      updateParticles(dt, width, height, config, intensity);
      
      // Request next frame
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [currentMode, intensity, width, height]);

  // Pulse animation
  useEffect(() => {
    const config = MODE_CONFIGS[currentMode];
    pulse.value = withRepeat(
      withTiming(1, { duration: config.pulseSpeed, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [currentMode]);

  // Scanline animation
  useEffect(() => {
    const config = MODE_CONFIGS[currentMode];
    const duration = 8000 / config.particleSpeed;
    scanlineOffset.value = withRepeat(
      withTiming(1, { duration, easing: Easing.linear }),
      -1,
      false
    );
  }, [currentMode, intensity]);

  // Touch interaction
  const touchHandler = useRef((({ x, y, state }: { x: number; y: number; state: string }) => {
    if (state === 'active' || state === 'start') {
      spawnParticlesAt(x, y, 5);
    }
  })) as any;

  // Particle helper functions (defined here to access particlesRef)
  const createParticle = (width: number, height: number, config: typeof MODE_CONFIGS.CALM): Particle => {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * Math.max(width, height) * 0.6;
    const speed = config.particleSpeed * (0.5 + Math.random() * 0.5);
    
    return {
      x: width / 2 + Math.cos(angle) * radius,
      y: height / 2 + Math.sin(angle) * radius,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 1 + Math.random() * 2,
      opacity: 0.2 + Math.random() * 0.4,
      life: Math.random() * 100,
      maxLife: 50 + Math.random() * 100,
    };
  };

  const updateParticles = (dt: number, width: number, height: number, config: typeof MODE_CONFIGS.CALM, intensity: number) => {
    const particles = particlesRef.current;
    const centerX = width / 2;
    const centerY = height / 2;
    
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      
      // Update position
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      
      // Gentle attraction to center
      const dx = centerX - p.x;
      const dy = centerY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        const force = 0.0001 * intensity;
        p.vx += (dx / dist) * force * dt * 60;
        p.vy += (dy / dist) * force * dt * 60;
      }
      
      // Aging
      p.life += dt * 60;
      if (p.life >= p.maxLife) {
        // Respawn particle
        const newParticle = createParticle(width, height, MODE_CONFIGS.CALM);
        // Keep position somewhat near current
        particlesRef.current[i] = {
          ...newParticle,
          x: p.x + (Math.random() - 0.5) * 100,
          y: p.y + (Math.random() - 0.5) * 100,
        };
      }
    }
  };

  const spawnParticlesAt = (x: number, y: number, count: number) => {
    const config = MODE_CONFIGS.CALM;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = config.particleSpeed * 2;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        opacity: 0.6 + Math.random() * 0.4,
        life: 0,
        maxLife: 30 + Math.random() * 40,
      });
    }
  };

  // Create pulse glow style
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.3, 0.8]),
  }));

  // Scanline animation style
  const scanlineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(scanlineOffset.value, [0, 1], [0, height]) }],
    opacity: MODE_CONFIGS[currentMode].scanlineOpacity,
  }));

  // Mode transition overlay
  const transitionStyle = useAnimatedStyle(() => ({
    opacity: interpolate(modeTransitionRef.value, [0, 0.5, 1], [0, 0.3, 0]),
  }));

  // Pulse glow style
  const pulseGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.3, 0.8]),
  }));

  // Scanline animation style
  const scanlineStyle2 = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(scanlineOffset.value, [0, 1], [0, height]) }],
    opacity: MODE_CONFIGS[currentMode].scanlineOpacity,
  }));

  // Mode transition overlay
  const transitionStyle2 = useAnimatedStyle(() => ({
    opacity: interpolate(modeTransitionRef.value, [0, 0.5, 1], [0, 0.3, 0]),
  }));

  // Render particles using Skia
  const particles = particlesRef.current.map((particle, index) => (
    <Circle
      key={index}
      cx={particle.x}
      cy={particle.y}
      r={particle.size}
      color={`rgba(0, 229, 255, ${particle.opacity * (particle.life / particle.maxLife)})`}
    />
  ));

  return (
    <View style={styles.container} onTouchStart={touchHandler.current} onTouchMove={touchHandler.current} onTouchEnd={touchHandler.current}>
      <Canvas style={StyleSheet.absoluteFill}>
        {/* Base gradient background */}
        <Rect x={0} y={0} width={width} height={height}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(width, height)}
            colors={[
              '#020708',
              '#031114',
              '#010506',
              '#000000',
            ]}
          />
        </Rect>

        {/* Ambient glow circles */}
        <Circle
          cx={width * 0.88}
          cy={height * 0.15}
          r={width * 0.55}
          color={`rgba(0, 229, 255, ${MODE_CONFIGS[currentMode].glowIntensity * intensity})`}
        />
        <Circle
          cx={width * 0.03}
          cy={height * 0.7}
          r={width * 0.7}
          color={`rgba(0, 229, 255, ${MODE_CONFIGS[currentMode].glowIntensity * intensity * 0.7})`}
        />

        {/* Mode transition overlay */}
        <Rect
          x={0} y={0} width={width} height={height}
          color="rgba(0, 229, 255, 0.15)"
          style={transitionStyle as any}
        />

        {/* Scanline effect */}
        <Rect
          x={0} y={0} width={width} height={height / 2}
          color="rgba(0, 229, 255, 0.02)"
          style={scanlineStyle2 as any}
        />

        {/* Particles */}
        <Group>
          {particles}
        </Group>

        {/* Center pulse ring (only in non-boss modes) */}
        {currentMode !== 'BOSS' && currentMode !== 'WARNING' && (
          <Circle
            cx={width / 2}
            cy={height / 2}
            r={Math.min(width, height) * 0.15}
            color="rgba(0, 229, 255, 0.05)"
            style={pulseGlowStyle as any}
          />
        )}

        {children}
      </Canvas>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default SystemAmbientBackground;