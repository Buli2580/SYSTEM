import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { SYSTEM_COLORS as C } from '../core';
import { presentationEventBus, type PresentationEventData, type PresentationEventType } from './PresentationEvents';

type OverlayVariant =
  | 'quest'
  | 'success'
  | 'progress'
  | 'warning'
  | 'danger'
  | 'boss'
  | 'system';

type OverlayConfig = {
  variant: OverlayVariant;
  title: string;
  subtitle?: string;
  duration: number;
  dismissible: boolean;
};

const CONFIGS: Partial<Record<PresentationEventType, OverlayConfig>> = {
  SYSTEM_BOOT: { variant: 'system', title: 'SYSTEM INITIALIZING', duration: 2200, dismissible: false },
  SYSTEM_READY: { variant: 'system', title: 'SYSTEM ONLINE', duration: 2200, dismissible: false },
  QUEST_DISCOVERED: { variant: 'quest', title: 'NEW QUEST DISCOVERED', subtitle: 'A new protocol awaits activation', duration: 3600, dismissible: true },
  QUEST_ACCEPTED: { variant: 'quest', title: 'QUEST ACCEPTED', subtitle: 'Protocol initialized', duration: 2800, dismissible: true },
  QUEST_STARTED: { variant: 'quest', title: 'QUEST STARTED', subtitle: 'Tracking protocol active', duration: 2600, dismissible: true },
  QUEST_COMPLETE: { variant: 'success', title: 'QUEST COMPLETE', subtitle: 'Verification successful', duration: 4200, dismissible: true },
  QUEST_FAILED: { variant: 'danger', title: 'QUEST FAILED', subtitle: 'Protocol aborted', duration: 3800, dismissible: true },
  XP_GAIN: { variant: 'progress', title: 'XP GAINED', duration: 2200, dismissible: false },
  LEVEL_UP: { variant: 'success', title: 'LEVEL UP', subtitle: 'System evolution detected', duration: 4800, dismissible: true },
  REWARD_RECEIVED: { variant: 'success', title: 'REWARD ACQUIRED', duration: 3000, dismissible: true },
  ACHIEVEMENT_UNLOCKED: { variant: 'success', title: 'ACHIEVEMENT UNLOCKED', subtitle: 'New milestone registered', duration: 4400, dismissible: true },
  STREAK_UPDATED: { variant: 'progress', title: 'STREAK UPDATED', duration: 2500, dismissible: false },
  STREAK_MILESTONE: { variant: 'success', title: 'STREAK MILESTONE', subtitle: 'Consistency protocol achieved', duration: 4200, dismissible: true },
  SECTOR_DISCOVERED: { variant: 'quest', title: 'SECTOR DISCOVERED', subtitle: 'New territory mapped', duration: 3200, dismissible: true },
  WARNING: { variant: 'warning', title: 'SYSTEM WARNING', duration: 3600, dismissible: true },
  BOSS_APPEARED: { variant: 'boss', title: 'BOSS PROTOCOL ACTIVATED', subtitle: 'Hostile entity detected', duration: 4800, dismissible: false },
  BOSS_PHASE_CHANGED: { variant: 'boss', title: 'BOSS PHASE TRANSITION', subtitle: 'Combat parameters updated', duration: 3200, dismissible: true },
  BOSS_DAMAGE: { variant: 'boss', title: 'DAMAGE DEALT', duration: 1500, dismissible: false },
  BOSS_DEFEATED: { variant: 'success', title: 'BOSS DEFEATED', subtitle: 'Hostile entity neutralized', duration: 5200, dismissible: true },
  DAILY_COMPLETED: { variant: 'success', title: 'DAILY PROTOCOL COMPLETE', duration: 3800, dismissible: true },
  WEEKLY_COMPLETED: { variant: 'success', title: 'WEEKLY PROTOCOL COMPLETE', duration: 4200, dismissible: true },
  SYSTEM_WARNING: { variant: 'warning', title: 'SYSTEM WARNING', duration: 3800, dismissible: true },
  SYSTEM_ERROR: { variant: 'danger', title: 'SYSTEM ERROR', duration: 4600, dismissible: true },
};

function accentFor(variant: OverlayVariant) {
  if (variant === 'success') return C.success;
  if (variant === 'warning') return C.warning;
  if (variant === 'danger' || variant === 'boss') return C.danger;
  return C.cyan;
}

function iconFor(variant: OverlayVariant) {
  if (variant === 'success') return '✓';
  if (variant === 'warning') return '!';
  if (variant === 'danger') return '×';
  if (variant === 'boss') return '▼';
  if (variant === 'progress') return '▲';
  if (variant === 'system') return '◇';
  return '▣';
}

function payloadTitle(event: PresentationEventData, fallback: string) {
  const p = event.payload;
  if (typeof p?.questTitle === 'string') return p.questTitle;
  if (typeof p?.bossName === 'string') return p.bossName;
  if (event.type === 'ACHIEVEMENT_UNLOCKED' && typeof p?.name === 'string') return p.name;
  if (event.type === 'XP_GAIN' && typeof p?.amount === 'number') return `+${p.amount} XP`;
  if (event.type === 'STREAK_UPDATED' && typeof p?.currentStreak === 'number') return `${p.currentStreak} DAY STREAK`;
  if (event.type === 'BOSS_DAMAGE' && typeof p?.damage === 'number') return `-${p.damage} HP`;
  return fallback;
}

function payloadSubtitle(event: PresentationEventData, fallback?: string) {
  const p = event.payload;
  if (typeof p?.subtitle === 'string') return p.subtitle;
  if (typeof p?.reason === 'string') return p.reason;
  if (typeof p?.message === 'string') return p.message;
  if (event.type === 'ACHIEVEMENT_UNLOCKED' && typeof p?.tier === 'string') return `${p.tier} ACHIEVEMENT`;
  return fallback;
}

export default function SystemEventOverlay() {
  const [current, setCurrent] = useState<PresentationEventData | null>(null);
  const currentRef = useRef<PresentationEventData | null>(null);
  const queueRef = useRef<PresentationEventData[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const showNext = useCallback(() => {
    if (currentRef.current) return;
    const next = queueRef.current.shift();
    if (!next) return;
    currentRef.current = next;
    setCurrent(next);
  }, []);

  const dismiss = useCallback(() => {
    clearTimer();
    currentRef.current = null;
    setCurrent(null);
    setTimeout(showNext, 180);
  }, [clearTimer, showNext]);

  useEffect(() => {
    const unsubscribe = presentationEventBus.onAny(event => {
      if (!CONFIGS[event.type]) return;
      if (!currentRef.current) {
        currentRef.current = event;
        setCurrent(event);
      } else {
        queueRef.current.push(event);
        queueRef.current.sort((a, b) => {
          const weight = { critical: 0, high: 1, normal: 2, low: 3 };
          return weight[a.priority] - weight[b.priority];
        });
      }
    });
    return () => {
      unsubscribe();
      clearTimer();
      queueRef.current = [];
      currentRef.current = null;
    };
  }, [clearTimer]);

  useEffect(() => {
    clearTimer();
    if (!current) return;
    const config = CONFIGS[current.type];
    if (!config) return;
    timerRef.current = setTimeout(dismiss, config.duration);
    return clearTimer;
  }, [current, clearTimer, dismiss]);

  if (!current) return null;

  const config = CONFIGS[current.type];
  if (!config) return null;
  const accent = accentFor(config.variant);
  const title = payloadTitle(current, config.title);
  const subtitle = payloadSubtitle(current, config.subtitle);

  return (
    <View pointerEvents="box-none" style={styles.layer}>
      <Animated.View entering={FadeInDown.duration(260)} exiting={FadeOutUp.duration(180)} style={[styles.card, { borderColor: accent }]}>
        <View style={[styles.accent, { backgroundColor: accent }]} />
        <View style={[styles.iconWrap, { borderColor: accent }]}>
          <Text style={[styles.icon, { color: accent }]}>{iconFor(config.variant)}</Text>
        </View>
        <View style={styles.copy}>
          <Text style={[styles.eyebrow, { color: accent }]}>{config.variant === 'boss' ? 'BOSS EVENT' : 'SYSTEM EVENT'}</Text>
          <Text style={styles.title}>{title}</Text>
          {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {config.dismissible && (
          <Pressable accessibilityRole="button" accessibilityLabel="Zamknij komunikat" onPress={dismiss} hitSlop={12} style={styles.dismiss}>
            <Text style={styles.dismissText}>×</Text>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 54,
    left: 14,
    right: 14,
    zIndex: 9999,
  },
  card: {
    minHeight: 86,
    borderWidth: 1,
    borderRadius: 18,
    backgroundColor: '#061116f5',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingLeft: 18,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#08191f',
  },
  icon: {
    fontSize: 19,
    fontWeight: '900',
  },
  copy: {
    flex: 1,
    paddingRight: 8,
  },
  eyebrow: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.8,
  },
  title: {
    color: C.white,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
    marginTop: 3,
  },
  subtitle: {
    color: C.textMuted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },
  dismiss: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    color: C.textMuted,
    fontSize: 22,
    lineHeight: 24,
  },
});
