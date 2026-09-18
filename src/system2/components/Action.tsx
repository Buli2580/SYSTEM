import { Pressable, Text } from 'react-native';
export default function Action({ label, onPress, disabled = false, danger = false }: { label: string; onPress: () => void; disabled?: boolean; danger?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={{ minHeight: 48, justifyContent: 'center', padding: 12, marginTop: 10, borderRadius: 10, backgroundColor: danger ? '#381b20' : '#0c2931', opacity: disabled ? 0.45 : 1 }}>
    <Text style={{ color: danger ? '#ffb9b9' : '#6ceeff', fontSize: 12, fontWeight: '900' }}>{label}</Text>
  </Pressable>;
}
