import { Pressable, Text, View } from 'react-native';
export default function SystemError({ message, retry }: { message: string; retry: () => void }) {
  return <View accessibilityRole="alert" style={{ padding: 20, borderColor: '#a74c4c', borderWidth: 1, borderRadius: 16, marginVertical: 16 }}>
    <Text style={{ color: '#ffb7a5', fontWeight: '900' }}>SYSTEM ERROR</Text>
    <Text style={{ color: '#d9e1e8', marginVertical: 12 }}>{message}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Ponów operację" onPress={retry} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: '#62efff', fontWeight: '900' }}>RETRY</Text></Pressable>
  </View>;
}
