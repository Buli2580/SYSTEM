import { Pressable, StyleSheet, Text } from 'react-native';
import { SYSTEM_COLORS as C } from '../core';
import { playFeedback } from '../identity/audio';
export default function Action({ label, onPress, disabled = false, danger = false }: { label: string; onPress: () => void; disabled?: boolean; danger?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={() => { playFeedback('UI_TAP'); onPress(); }}
    style={({ pressed }) => [styles.root, danger ? styles.danger : styles.normal, disabled && styles.disabled, pressed && styles.pressed]}>
    <Text style={[styles.text, danger ? styles.dangerText : styles.normalText]}>{label}</Text>
  </Pressable>;
}
const styles = StyleSheet.create({
  root: { minHeight: 48, justifyContent: 'center', padding: 12, marginTop: 10, borderRadius: 10 },
  normal: { backgroundColor: C.panelSoft },
  danger: { backgroundColor: 'rgba(255,80,103,0.16)' },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.78 },
  text: { fontSize: 12, fontWeight: '900' },
  normalText: { color: C.cyan },
  dangerText: { color: '#FFB9B9' },
});
