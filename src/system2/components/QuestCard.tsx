import { useEffect } from 'react';

import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

import * as Haptics from '../identity/feedback';

import { SYSTEM_COLORS } from '../core';

export default function QuestCard() {
  const glow = useSharedValue(0);

  useEffect(() => {
    glow.value = withRepeat(
      withTiming(1, {
        duration: 1500,
      }),
      -1,
      true
    );
  }, [glow]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      glow.value,
      [0, 1],
      [0.25, 0.8]
    ),
  }));

  async function startQuest() {
    await Haptics.impactAsync(
      Haptics.ImpactFeedbackStyle.Medium
    );
  }

  return (
    <View style={styles.root}>
      <Animated.View
        pointerEvents="none"
        style={[styles.glowLine, glowStyle]}
      />

      <View style={styles.header}>
        <Text style={styles.category}>
          MAIN QUEST
        </Text>

        <View style={styles.statusBadge}>
          <Text style={styles.status}>
            AVAILABLE
          </Text>
        </View>
      </View>

      <Text style={styles.title}>
        PIERWSZE PRZEBUDZENIE
      </Text>

      <Text style={styles.description}>
        Ukończ 3 prawdziwe i zweryfikowane
        misje. Dopiero wtedy SYSTEM uzna
        przebudzenie za zakończone.
      </Text>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>
            PROGRESS
          </Text>
          <Text style={styles.metaValue}>
            0 / 3
          </Text>
        </View>

        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>
            REWARD
          </Text>
          <Text style={styles.reward}>
            +300 XP
          </Text>
        </View>

        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>
            VERIFY
          </Text>
          <Text style={styles.metaValue}>
            REQUIRED
          </Text>
        </View>
      </View>

      <View style={styles.progress}>
        <View style={styles.progressFill} />
      </View>

      <Pressable
        onPress={startQuest}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
      >
        <Text style={styles.buttonText}>
          ROZPOCZNIJ MISJĘ
        </Text>

        <Text style={styles.buttonArrow}>
          →
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: SYSTEM_COLORS.line,
    backgroundColor: '#061116',
    padding: 18,
  },

  glowLine: {
    position: 'absolute',
    width: 4,
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: SYSTEM_COLORS.cyan,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  category: {
    color: SYSTEM_COLORS.cyan,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
  },

  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: 'rgba(0,229,255,0.06)',
  },

  status: {
    color: SYSTEM_COLORS.cyanSoft,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  title: {
    color: SYSTEM_COLORS.white,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 13,
  },

  description: {
    color: SYSTEM_COLORS.textMuted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 8,
  },

  metaRow: {
    flexDirection: 'row',
    marginTop: 18,
  },

  metaItem: {
    flex: 1,
  },

  metaLabel: {
    color: SYSTEM_COLORS.textVeryMuted,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1.3,
  },

  metaValue: {
    color: SYSTEM_COLORS.text,
    fontSize: 10,
    fontWeight: '900',
    marginTop: 5,
  },

  reward: {
    color: SYSTEM_COLORS.cyan,
    fontSize: 10,
    fontWeight: '900',
    marginTop: 5,
  },

  progress: {
    height: 5,
    borderRadius: 999,
    backgroundColor: '#09252C',
    overflow: 'hidden',
    marginTop: 16,
  },

  progressFill: {
    width: '1%',
    height: '100%',
    backgroundColor: SYSTEM_COLORS.cyan,
  },

  button: {
    height: 52,
    borderRadius: 13,
    marginTop: 17,
    backgroundColor: SYSTEM_COLORS.cyan,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 19,
  },

  buttonPressed: {
    opacity: 0.75,
  },

  buttonText: {
    color: '#001014',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },

  buttonArrow: {
    color: '#001014',
    fontSize: 22,
    fontWeight: '500',
  },
});