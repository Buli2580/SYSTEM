import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SYSTEM_COLORS } from '../core';

export default function BottomNavigation() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.root,
        {
          paddingBottom: Math.max(
            insets.bottom,
            8
          ),
        },
      ]}
    >
      <NavItem
        label="SYSTEM"
        active
        shape="diamond"
      />

      <NavItem
        label="QUESTY"
        shape="diamond"
      />

      <NavItem
        label="POSTAĆ"
        shape="diamond"
      />

      <NavItem
        label="ŚWIAT"
        shape="circle"
      />

      <NavItem
        label="WIĘCEJ"
        shape="dots"
      />
    </View>
  );
}

function NavItem({
  label,
  active = false,
  shape,
}: {
  label: string;
  active?: boolean;
  shape: 'diamond' | 'circle' | 'dots';
}) {
  return (
    <Pressable style={styles.item}>
      {shape === 'diamond' && (
        <View
          style={[
            styles.diamond,
            active && styles.activeDiamond,
          ]}
        />
      )}

      {shape === 'circle' && (
        <View style={styles.circle} />
      )}

      {shape === 'dots' && (
        <View style={styles.dots}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      )}

      <Text
        style={[
          styles.label,
          active && styles.activeLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    borderTopWidth: 1,
    borderTopColor: SYSTEM_COLORS.line,
    backgroundColor: '#020709',
    flexDirection: 'row',
    paddingTop: 11,
  },

  item: {
    flex: 1,
    alignItems: 'center',
    minHeight: 54,
  },

  diamond: {
    width: 13,
    height: 13,
    borderWidth: 1,
    borderColor: SYSTEM_COLORS.textVeryMuted,
    transform: [{ rotate: '45deg' }],
    marginBottom: 8,
  },

  activeDiamond: {
    backgroundColor: SYSTEM_COLORS.cyan,
    borderColor: SYSTEM_COLORS.cyan,
  },

  circle: {
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: SYSTEM_COLORS.textVeryMuted,
    marginBottom: 7,
  },

  dots: {
    flexDirection: 'row',
    gap: 4,
    height: 15,
    alignItems: 'center',
    marginBottom: 7,
  },

  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: SYSTEM_COLORS.textVeryMuted,
  },

  label: {
    color: SYSTEM_COLORS.textVeryMuted,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  activeLabel: {
    color: SYSTEM_COLORS.cyan,
  },
});