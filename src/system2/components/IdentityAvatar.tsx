import { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
export default function IdentityAvatar({ uri, evolution, size = 140 }: { uri?: string; evolution: number; size?: number }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);
  const color = evolution >= 2 ? '#d4adff' : evolution >= 1 ? '#62efff' : '#417480';
  return <View accessibilityLabel={`Avatar, Evolution ${evolution}`} style={{ width: size, height: size, borderRadius: size / 2, borderWidth: evolution + 1, borderColor: color, backgroundColor: '#072028', alignItems: 'center', justifyContent: 'center', shadowColor: color, shadowOpacity: 0.6, shadowRadius: 8 + evolution * 5 }}>
    <View style={{ width: size - 16, height: size - 16, borderRadius: size / 2, borderWidth: 1, borderColor: color, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      {uri && !failed ? <Image accessibilityLabel="Avatar gracza" source={{ uri }} style={{ width: '100%', height: '100%' }} onError={() => setFailed(true)} /> : <Text style={{ color, fontSize: size / 3 }}>◇</Text>}
    </View>
  </View>;
}
