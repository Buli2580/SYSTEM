import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SYSTEM_COLORS as C } from '../core';

export default function SystemError({ message, retry, actionLabel = 'SPRÓBUJ PONOWNIE' }: {
  message: string;
  retry: () => void;
  actionLabel?: string;
}) {
  return <View accessibilityRole="alert" style={styles.root}>
    <Text style={styles.title}>BŁĄD SYSTEMU</Text>
    <Text style={styles.message}>{message}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={actionLabel} onPress={retry} style={({ pressed }) => [styles.retry, pressed && styles.pressed]}>
      <Text style={styles.retryText}>{actionLabel}</Text>
    </Pressable>
  </View>;
}
const styles = StyleSheet.create({
  root: { padding: 20, borderColor: C.danger, borderWidth: 1, borderRadius: 16, marginVertical: 16, backgroundColor: 'rgba(255,80,103,0.06)' },
  title: { color: C.danger, fontWeight: '900' },
  message: { color: C.text, marginVertical: 12, lineHeight: 20 },
  retry: { minHeight: 48, justifyContent: 'center' },
  retryText: { color: C.cyan, fontWeight: '900' },
  pressed: { opacity: 0.7 },
});
