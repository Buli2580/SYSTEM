import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SYSTEM_COLORS as C } from '../core';
import { presentationEventBus, PresentationEventPresets } from './PresentationEvents';
import type { PresentationEventData } from './PresentationEvents';

type OverlayVariant = 
  | 'new_quest'
  | 'quest_accepted'
  | 'quest_complete'
  | 'quest_failed'
  | 'xp_gain'
  | 'level_up'
  | 'reward_received'
  | 'streak_updated'
  | 'streak_milestone'
  | 'sector_discovered'
  | 'warning'
  | 'boss_appeared'
  | 'boss_phase_changed'
  | 'boss_damage'
  | 'boss_defeated'
  | 'daily_completed'
  | 'weekly_completed'
  | 'system_warning'
  | 'system_error';

interface OverlayConfig {
  variant: OverlayVariant;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  duration?: number;
  dismissible?: boolean;
  onDismiss?: () => void;
  onAction?: () => void;
  actionLabel?: string;
}

const OVERLAY_CONFIGS: Record<OverlayVariant, OverlayConfig> = {
  new_quest: {
    variant: 'new_quest',
    title: 'NEW QUEST DISCOVERED',
    subtitle: 'A new protocol awaits activation',
    duration: 4000,
    dismissible: true,
  },
  quest_accepted: {
    variant: 'quest_accepted',
    title: 'QUEST ACCEPTED',
    subtitle: 'Protocol initialized. Awaiting activation.',
    duration: 3000,
    dismissible: true,
  },
  quest_complete: {
    variant: 'quest_complete',
    title: 'QUEST COMPLETE',
    subtitle: 'Verification successful. Rewards claimed.',
    duration: 5000,
    dismissible: true,
  },
  quest_failed: {
    variant: 'quest_failed',
    title: 'QUEST FAILED',
    subtitle: 'Verification rejected. Protocol aborted.',
    duration: 4000,
    dismissible: true,
  },
  xp_gain: {
    variant: 'xp_gain',
    title: 'XP GAINED',
    duration: 2500,
    dismissible: false,
  },
  level_up: {
    variant: 'level_up',
    title: 'LEVEL UP',
    subtitle: 'System evolution detected',
    duration: 6000,
    dismissible: true,
  },
  reward_received: {
    variant: 'reward_received',
    title: 'REWARD ACQUIRED',
    duration: 3000,
    dismissible: true,
  },
  streak_updated: {
    variant: 'streak_updated',
    title: 'STREAK UPDATED',
    duration: 3000,
    dismissible: false,
  },
  streak_milestone: {
    variant: 'streak_milestone',
    title: 'STREAK MILESTONE',
    subtitle: 'Consistency protocol achieved',
    duration: 5000,
    dismissible: true,
  },
  sector_discovered: {
    variant: 'sector_discovered',
    title: 'SECTOR DISCOVERED',
    subtitle: 'New territory mapped in SYSTEM WORLD',
    duration: 3500,
    dismissible: true,
  },
  warning: {
    variant: 'warning',
    title: 'SYSTEM WARNING',
    duration: 4000,
    dismissible: true,
  },
  boss_appeared: {
    variant: 'boss_appeared',
    title: 'BOSS PROTOCOL ACTIVATED',
    subtitle: 'Hostile entity detected. Engage combat protocols.',
    duration: 5000,
    dismissible: false,
  },
  boss_phase_changed: {
    variant: 'boss_phase_changed',
    title: 'BOSS PHASE TRANSITION',
    subtitle: 'Combat parameters updated',
    duration: 3500,
    dismissible: true,
  },
  boss_damage: {
    variant: 'boss_damage',
    title: 'DAMAGE DEALT',
    duration: 1500,
    dismissible: false,
  },
  boss_defeated: {
    variant: 'boss_defeated',
    title: 'BOSS DEFEATED',
    subtitle: 'Hostile entity neutralized. Protocol complete.',
    duration: 6000,
    dismissible: true,
  },
  daily_completed: {
    variant: 'daily_completed',
    title: 'DAILY PROTOCOL COMPLETE',
    subtitle: 'All daily objectives satisfied',
    duration: 4000,
    dismissible: true,
  },
  weekly_completed: {
    variant: 'weekly_completed',
    title: 'WEEKLY PROTOCOL COMPLETE',
    subtitle: 'Weekly cycle synchronized',
    duration: 4500,
    dismissible: true,
  },
  system_warning: {
    variant: 'system_warning',
    title: 'SYSTEM WARNING',
    duration: 4000,
    dismissible: true,
  },
  system_error: {
    variant: 'system_error',
    title: 'SYSTEM ERROR',
    duration: 5000,
    dismissible: true,
  },
};

interface SystemEventOverlayProps {
  children?: React.ReactNode;
}

export default function SystemEventOverlay({ children }: SystemEventOverlayProps) {
  const [queue, setQueue] = useState<Array<{ id: number; config: OverlayConfig; payload?: Record<string, unknown> }>>([]);
  const currentIdRef = useRef(0);
  const visibleRef = useRef(false);
  const currentOverlayRef = useRef<{ config: OverlayConfig; payload?: Record<string, unknown> } | null>(null);

  useEffect(() => {
    const unsub = presentationEventBus.onAny((event) => {
      const preset = getPresetForEvent(event.type);
      if (preset) {
        const config = OVERLAY_CONFIGS[preset.variant];
        if (config) {
          showOverlay(config, event.payload);
        }
      }
    });
    return () => unsub();
  }, []);

  const getPresetForEvent = (type: string): { variant: OverlayVariant } | null => {
    switch (type) {
      case 'QUEST_DISCOVERED': return { variant: 'new_quest' };
      case 'QUEST_ACCEPTED': return { variant: 'quest_accepted' };
      case 'QUEST_COMPLETE': return { variant: 'quest_complete' };
      case 'QUEST_FAILED': return { variant: 'quest_failed' };
      case 'XP_GAIN': return { variant: 'xp_gain' };
      case 'LEVEL_UP': return { variant: 'level_up' };
      case 'REWARD_RECEIVED': return { variant: 'reward_received' };
      case 'STREAK_UPDATED': return { variant: 'streak_updated' };
      case 'STREAK_MILESTONE': return { variant: 'streak_milestone' };
      case 'SECTOR_DISCOVERED': return { variant: 'sector_discovered' };
      case 'WARNING': return { variant: 'warning' };
      case 'BOSS_APPEARED': return { variant: 'boss_appeared' };
      case 'BOSS_PHASE_CHANGED': return { variant: 'boss_phase_changed' };
      case 'BOSS_DAMAGE': return { variant: 'boss_damage' };
      case 'BOSS_DEFEATED': return { variant: 'boss_defeated' };
      case 'DAILY_COMPLETED': return { variant: 'daily_completed' };
      case 'WEEKLY_COMPLETED': return { variant: 'weekly_completed' };
      case 'SYSTEM_WARNING': return { variant: 'system_warning' };
      case 'SYSTEM_ERROR': return { variant: 'system_error' };
      default: return null;
    }
  };

  const showOverlay = (config: OverlayConfig, payload?: Record<string, unknown>) => {
    const id = ++currentIdRef.current;
    setQueue(prev => [...prev, { id, config, payload }]);
    processQueue();
  };

  const processQueue = () => {
    if (visibleRef.current || queue.length === 0) return;
    
    const next = queue[0];
    if (!next) return;
    
    visibleRef.current = true;
    currentOverlayRef.current = { config: next.config, payload: next.payload };
    setQueue(prev => prev.slice(1));
    
    // Auto-dismiss after duration
    if (next.config.duration && next.config.duration > 0) {
      setTimeout(() => {
        dismissCurrentOverlay();
      }, next.config.duration);
    }
  };

  const dismissCurrentOverlay = () => {
    visibleRef.current = false;
    currentOverlayRef.current = null;
    setTimeout(() => {
      processQueue();
    }, 300); // Wait for exit animation
  };

  const currentOverlay = currentOverlayRef.current;

  
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(1, { duration: 300 });
    translateY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) });
    return () => {
      progress.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(-50, { duration: 300 });
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const variantStyles: Record<OverlayVariant, { bg: string; accent: string; iconBg: string }> = {
    new_quest: { bg: '#061116', accent: C.cyan, iconBg: 'rgba(0,229,255,0.15)' },
    quest_accepted: { bg: '#061116', accent: C.cyan, iconBg: 'rgba(0,229,255,0.15)' },
    quest_complete: { bg: '#061512', accent: C.success, iconBg: 'rgba(0,200,100,0.15)' },
    quest_failed: { bg: '#1a0a0a', accent: C.danger, iconBg: 'rgba(255,68,68,0.15)' },
    xp_gain: { bg: '#061116', accent: C.cyan, iconBg: 'rgba(0,229,255,0.15)' },
    level_up: { bg: '#061512', accent: C.cyan, iconBg: 'rgba(0,229,255,0.15)' },
    reward_received: { bg: '#061116', accent: C.cyan, iconBg: 'rgba(0,229,255,0.15)' },
    streak_updated: { bg: '#061116', accent: C.warning, iconBg: 'rgba(255,180,0,0.15)' },
    streak_milestone: { bg: '#061512', accent: C.warning, iconBg: 'rgba(255,180,0,0.15)' },
    sector_discovered: { bg: '#061116', accent: C.cyan, iconBg: 'rgba(0,229,255,0.15)' },
    warning: { bg: '#1a0a0a', accent: C.warning, iconBg: 'rgba(255,180,0,0.15)' },
    boss_appeared: { bg: '#1a0a0a', accent: C.danger, iconBg: 'rgba(255,68,68,0.15)' },
    boss_phase_changed: { bg: '#1a0a0a', accent: C.warning, iconBg: 'rgba(255,180,0,0.15)' },
    boss_damage: { bg: '#061512', accent: C.success, iconBg: 'rgba(0,200,100,0.15)' },
    boss_defeated: { bg: '#061512', accent: C.success, iconBg: 'rgba(0,200,100,0.15)' },
    daily_completed: { bg: '#061512', accent: C.success, iconBg: 'rgba(0,200,100,0.15)' },
    weekly_completed: { bg: '#061512', accent: C.cyan, iconBg: 'rgba(0,229,255,0.15)' },
    system_warning: { bg: '#1a0a0a', accent: C.warning, iconBg: 'rgba(255,180,0,0.15)' },
    system_error: { bg: '#1a0a0a', accent: C.danger, iconBg: 'rgba(255,68,68,0.15)' },
  };

  if (!currentOverlay) return <>{children}</>;
  const { config, payload } = currentOverlay;
  const title = typeof payload?.questTitle === 'string' ? payload.questTitle : config.title;
  const subtitle = typeof payload?.subtitle === 'string' ? payload.subtitle : config.subtitle;
  const variantStyle = variantStyles[config.variant] || variantStyles.new_quest;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {children}
      <Animated.View style={[styles.overlay, animatedStyle]} pointerEvents="box-none">
        <View
          style={[
            styles.toast,
            { backgroundColor: variantStyle.bg, borderColor: variantStyle.accent },
          ]}
        >
          <View style={styles.toastContent}>
            <View style={[styles.iconContainer, { backgroundColor: variantStyle.iconBg }]}>
              <Text style={[styles.icon, { color: variantStyle.accent }]}>{getIconForVariant(config.variant)}</Text>
            </View>
            <View style={styles.textContent}>
              <Text style={[styles.title, { color: variantStyle.accent }]}>{title}</Text>
              {subtitle && <Text style={[styles.subtitle, { color: C.textMuted }]}>{subtitle}</Text>}
            </View>
          </View>
          <View style={styles.progressBarContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                { backgroundColor: variantStyle.accent },
                { width: `${progress.value * 100}%` },
              ]}
            />
          </View>
      </View>
    </Animated.View>
    </View>
  );
}

function getIconForVariant(variant: OverlayVariant): string {
  switch (variant) {
    case 'new_quest': return '▣';
    case 'quest_accepted': return '▣';
    case 'quest_complete': return '✓';
    case 'quest_failed': return '✕';
    case 'xp_gain': return '⬆';
    case 'level_up': return '▲';
    case 'reward_received': return '◆';
    case 'streak_updated': return '▬';
    case 'streak_milestone': return '▲▲';
    case 'sector_discovered': return '◈';
    case 'warning': return '⚠';
    case 'boss_appeared': return '▼';
    case 'boss_phase_changed': return '◈';
    case 'boss_damage': return '▼';
    case 'boss_defeated': return '✓';
    case 'daily_completed': return '✓';
    case 'weekly_completed': return '✓✓';
    case 'system_warning': return '⚠';
    case 'system_error': return '✕';
    default: return '▣';
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  overlay: {
    width: '100%',
  },
  toast: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
    fontWeight: '900',
  },
  textContent: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  progressBar: {
    height: '100%',
    borderRadius: 0,
  },
});