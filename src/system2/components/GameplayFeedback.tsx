import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { SYSTEM_COLORS as C } from '../core';
import type { RewardReceipt } from '../core/rewards';

export type FeedbackItem = {
  id: string;
  type: 'XP' | 'LEVEL_UP' | 'SKILL_UP' | 'QUEST_COMPLETE' | 'DAILY_COMPLETE' | 'WEEKLY_COMPLETE' | 'BOSS_DAMAGE' | 'BOSS_DEFEATED' | 'STREAK_MILESTONE';
  message: string;
  detail?: string;
  color?: string;
  timestamp: number;
};

export function useGameplayFeedback() {
  const [feedbackQueue, setFeedbackQueue] = useState<FeedbackItem[]>([]);
  const isShowing = useRef(false);
  const currentIndex = useRef(0);

  const showFeedback = (item: Omit<FeedbackItem, 'id' | 'timestamp'>) => {
    const newItem: FeedbackItem = {
      ...item,
      id: `feedback_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
    };
    setFeedbackQueue(prev => [...prev, newItem]);
  };

  const dismissFeedback = (id: string) => {
    setFeedbackQueue(prev => prev.filter(f => f.id !== id));
  };

  return {
    feedbackQueue,
    showFeedback,
    dismissFeedback,
  };
}

export default function GameplayFeedback({ feedbackQueue, onDismiss }: { feedbackQueue: FeedbackItem[]; onDismiss: (id: string) => void }) {
  const [visibleItem, setVisibleItem] = useState<FeedbackItem | null>(null);
  const animation = useRef(new Animated.Value(0)).current;
  const queueRef = useRef(feedbackQueue);

  queueRef.current = feedbackQueue;

  useEffect(() => {
    if (visibleItem) return;
    const next = queueRef.current.find(f => !f.id.startsWith('dismissed_'));
    if (next) {
      setVisibleItem(next);
      animateIn();
    }
  }, [feedbackQueue, visibleItem]);

  const animateIn = () => {
    animation.setValue(0);
    Animated.timing(animation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => animateOut(), 3000);
    });
  };

  const animateOut = () => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (visibleItem) {
        onDismiss(visibleItem.id);
      }
      setVisibleItem(null);
    });
  };

  if (!visibleItem) return null;

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [80, 0],
  });
  const opacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const itemColor = visibleItem.color ?? C.cyan;

  return (
    <Animated.View style={[styles.container, { opacity, transform: [{ translateY }] }]}>
      <View style={[styles.card, { borderColor: itemColor }]}>
        <View style={[styles.accent, { backgroundColor: itemColor }]} />
        <View style={styles.content}>
          <Text style={[styles.message, { color: itemColor }]}>{visibleItem.message}</Text>
          {visibleItem.detail && <Text style={styles.detail}>{visibleItem.detail}</Text>}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    zIndex: 1000,
    pointerEvents: 'none',
  },
  card: {
    borderWidth: 2,
    borderRadius: 16,
    backgroundColor: '#061116',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  accent: {
    position: 'absolute',
    width: 4,
    top: 0,
    bottom: 0,
    left: 0,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  content: {
    gap: 4,
  },
  message: {
    color: C.white,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  detail: {
    color: C.textMuted,
    fontSize: 11,
    fontWeight: '900',
  },
});