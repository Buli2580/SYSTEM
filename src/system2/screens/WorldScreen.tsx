import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import SystemPage, { pageStyles as styles } from '../components/SystemPage';
import { useSystem } from '../state/SystemProvider';

export default function WorldScreen() {
  const router = useRouter();
  const { player, worldUnlocked } = useSystem();
  return <SystemPage title="SYSTEM WORLD" subtitle="WORLD PROTOCOL">
    {!worldUnlocked ? <View style={styles.panel}>
      <Text style={styles.label}>WORLD STATUS: LOCKED</Text>
      <Text style={styles.body}>Ukończ trzy questy Awakening Chapter 1, aby odblokować dostęp.</Text>
      <Pressable onPress={() => router.replace('/quests')}><Text style={styles.link}>PRZEJDŹ DO QUESTÓW →</Text></Pressable>
    </View> : <>
      <View style={styles.panel}>
        <Text style={styles.label}>WORLD STATUS: ONLINE</Text>
        <Text style={styles.title}>FIRST GATE SIGNAL DETECTED</Text>
        <Text style={styles.body}>DISCOVERED SECTORS</Text><Text style={styles.value}>{player.discoveredSectors}</Text>
        <Text style={styles.body}>TOTAL VERIFIED DISTANCE</Text><Text style={styles.value}>{Math.floor(player.totalDistanceMeters)} M</Text>
      </View>
      <View style={styles.panel}>
        <Text style={styles.label}>UNKNOWN SIGNAL // 01</Text>
        <Text style={styles.title}>EXPLORATION LOCKED</Text>
        <Text style={styles.body}>Dostęp do World został odblokowany. Mapa eksploracji i grywalne Gates będą kolejnym etapem. Sygnał nie ma jeszcze lokalizacji ani aktywnej misji.</Text>
      </View>
    </>}
  </SystemPage>;
}
