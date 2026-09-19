// SYSTEM 2.0 - Discovery Toast Component
// Toast notifications for sector/signal discovery

import { Animated, Easing } from 'react-native';
import { StyleSheet, View, Text } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { SYSTEM_COLORS as C } from '../../core';

interface DiscoveryToastProps {
  text: string | null;
  id: number;
}

export default function DiscoveryToast({ text, id }: DiscoveryToastProps) {
  const [visible, setVisible] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const timeoutRef = { current: null as ReturnType<typeof setTimeout> | null };

  useEffect(() => {
    if (text && id > 0) {
      setVisible(true);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        dismiss();
      }, 4000);
    } else if (!text && visible) {
      dismiss();
    }
  }, [text, id, visible]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -30, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      setVisible(false);
    });
  };

  if (!visible && !text) return null;

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          opacity: opacity,
          transform: [{ translateY: translateY }],
        },
      ]}
    >
      <Text style={styles.text}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: '#061116',
    borderWidth: 1,
    borderColor: '#00e5ff',
    borderRadius: 12,
    padding: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  text: {
    color: '#62efff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});