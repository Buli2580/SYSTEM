import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname, useRouter } from 'expo-router';

import { SYSTEM_COLORS } from '../core';

export default function BottomNavigation() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();

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
        active={pathname === '/'}
        onPress={() => router.replace('/')}
        shape="diamond"
      />

      <NavItem
        label="QUESTY"
        active={pathname === '/quests'}
        onPress={() => router.replace('/quests')}
        shape="diamond"
      />

      <NavItem
        label="POSTAĆ"
        active={pathname === '/character' || pathname === '/system-log'}
        onPress={() => router.replace('/character')}
        shape="diamond"
      />

      <NavItem
        label="ŚWIAT"
        active={pathname === '/world'}
        onPress={() => router.replace('/world')}
        shape="circle"
      />

      <NavItem
        label="WIĘCEJ"
        active={pathname === '/more'}
        onPress={() => router.replace('/more')}
        shape="dots"
      />
    </View>
  );
}

function NavItem({
  label,
  active = false,
  shape,
  onPress,
  unavailable = false,
}: {
  label: string;
  active?: boolean;
  shape: 'diamond' | 'circle' | 'dots';
  onPress?: () => void;
  unavailable?: boolean;
}) {
  return (
    <Pressable style={styles.item} onPress={onPress} disabled={unavailable}
      accessibilityRole="button" accessibilityState={{ disabled: unavailable, selected: active }}
      accessibilityLabel={label + (unavailable ? ' — wkrótce' : '')}>
      {shape === 'diamond' && (
        <View
          style={[
            styles.diamond,
            active && styles.activeDiamond,
          ]}
        />
      )}

      {shape === 'circle' && (
        <View style={[styles.circle, active && styles.activeDiamond]} />
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
      {unavailable && <Text style={styles.soon}>WKRÓTCE</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    minHeight: 108,
    borderTopWidth: 1,
    borderTopColor: SYSTEM_COLORS.line,
    backgroundColor: 'rgba(1,6,8,0.98)',
    flexDirection: 'row',
    paddingTop: 17,
  },

  item: {
    flex: 1,
    alignItems: 'center',
    minHeight: 54,
  },

  diamond: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: SYSTEM_COLORS.textVeryMuted,
    transform: [{ rotate: '45deg' }],
    marginBottom: 14,
  },

  activeDiamond: {
    backgroundColor: SYSTEM_COLORS.cyan,
    borderColor: SYSTEM_COLORS.cyan,
  },

  circle: {
    width: 23,
    height: 23,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SYSTEM_COLORS.textVeryMuted,
    marginBottom: 13,
  },

  dots: {
    flexDirection: 'row',
    gap: 7,
    height: 23,
    alignItems: 'center',
    marginBottom: 13,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: SYSTEM_COLORS.textVeryMuted,
  },

  label: {
    color: SYSTEM_COLORS.textVeryMuted,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  activeLabel: {
    color: SYSTEM_COLORS.cyan,
  },
  soon: { color: SYSTEM_COLORS.textMuted, fontSize: 6, marginTop: 5, letterSpacing: 1 },
});
