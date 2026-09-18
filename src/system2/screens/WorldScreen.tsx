import SystemScreen from '../components/SystemScreen';
import RewardSummary from '../components/RewardSummary';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SystemPage, { pageStyles } from '../components/SystemPage';
import BottomNavigation from '../components/BottomNavigation';
import WorldMap from '../components/world/WorldMap';
import DiscoveryToast from '../components/world/DiscoveryToast';
import { useSystem } from '../state/SystemProvider';
import { useWorldTracking } from '../world/useWorldTracking';
import { locationToSector } from '../world/sectors';
import { signalDistance } from '../world/signals';

export default function WorldScreen() {
  const router = useRouter();
  const { ready, worldUnlocked } = useSystem();
  // Do not mount the tracking hook/map until the persisted unlock is ready.
  if (!ready || !worldUnlocked) return <SystemPage title="SYSTEM WORLD" subtitle="WORLD PROTOCOL">
    <View style={pageStyles.panel}>
      <Text style={pageStyles.label}>WORLD LOCKED</Text>
      <Text style={pageStyles.body}>Complete Awakening to unlock SYSTEM WORLD.</Text>
      <Pressable onPress={() => router.replace('/quests')}><Text style={pageStyles.link}>PRZEJDŹ DO QUESTÓW →</Text></Pressable>
    </View>
  </SystemPage>;
  return <OnlineWorld />;
}
function OnlineWorld() {
  const { player, lastReward } = useSystem();
  const world = useWorldTracking();
  const insets = useSafeAreaInsets();
  const [follow, setFollow] = useState(true);
  const [centerRequest, setCenterRequest] = useState(0);
  const active = world.status === 'ACTIVE';
  const signalState = world.signal?.status ?? 'LOCKED';
  return <SystemScreen style={[styles.root, { paddingTop: 10, paddingBottom: 110 + insets.bottom }]}>
    <View style={styles.heading}>
      <Text style={styles.title}>SYSTEM WORLD</Text><Text style={styles.label}>WORLD STATUS: ONLINE</Text>
      <Text style={styles.body}>WORLD EXPLORATION · SECTORS DISCOVERED {world.sectorIds.length}</Text>
      <Text style={styles.body}>TOTAL DISTANCE {(player.totalDistanceMeters / 1000).toFixed(2)} KM · VERIFIED QUESTS</Text>
    </View>
    <View style={styles.map}>
      {world.fix ? <WorldMap fix={world.fix} sectorIds={world.sectorIds} signal={world.signal} follow={follow} centerRequest={centerRequest} /> :
        <View style={styles.empty}><Text style={styles.label}>{world.status === 'STARTING' ? 'STARTING // GPS' : 'INITIALIZE WORLD'}</Text>
          <Text style={styles.body}>Odkrywaj świat z aktywnym ekranem aplikacji.</Text></View>}
      <View style={styles.mapControls}>
        <Button label="CENTER" disabled={!world.fix} onPress={() => setCenterRequest(n => n + 1)} />
        <Button label={`FOLLOW PLAYER ${follow ? 'ON' : 'OFF'}`} onPress={() => setFollow(value => !value)} />
      </View>
      <DiscoveryToast text={world.feedback} id={world.feedbackId} />
    </View>
    <ScrollView style={{ maxHeight: 260 }} contentContainerStyle={styles.hud}>
      <Text style={styles.label}>GPS {world.status} · {world.fix ? `±${Math.round(world.fix.coords.accuracy ?? 0)} M` : '--'}</Text>
      <Text style={styles.small}>PLAYER SECTOR {world.fix ? locationToSector(world.fix.coords) : '--'} · PLAYER ● CYAN</Text>
      <Text style={styles.body}>{signalState === 'LOCATED' ? 'UNKNOWN SIGNAL LOCATED' : `FIRST SIGNAL: ${signalState}`}
        {world.signal && world.fix && signalState !== 'LOCATED' ? ` · ${Math.round(signalDistance(world.fix, world.signal))} M` : ''}</Text>
      {world.signal?.status === 'DETECTED' && <Text style={styles.small}>SIGNAL DETECTED · PROTOTYPE SIGNAL ● VIOLET</Text>}
      {world.signalError && <Text style={styles.error}>Nieprawidłowy zapis sygnału. Użyj RELOCATE SIGNAL po uruchomieniu GPS.</Text>}
      {world.error && <Text style={styles.error}>{world.error}</Text>}
      <View style={styles.actions}>
        {active ? <Button label="PAUSE GPS" onPress={world.pause} /> : <Button label={world.status === 'STARTING' ? 'STARTING…' : world.status === 'PAUSED' ? 'INITIALIZE WORLD' : 'SPRÓBUJ PONOWNIE'} disabled={world.status === 'STARTING'} onPress={() => { void world.start(); }} />}
        {world.permanentDenial && <Button label="USTAWIENIA" onPress={() => { void Linking.openSettings().catch(() => undefined); }} />}
        {signalState !== 'LOCATED' && <Button label={world.scanning ? 'SCANNING…' : world.signal || world.signalError ? 'RELOCATE SIGNAL' : 'SCAN FOR SIGNAL'} disabled={!active || world.scanning} onPress={() => { void world.scan(Boolean(world.signal || world.signalError)); }} />}
      </View>
      <Text style={styles.small}>Do not enter private or unsafe areas.</Text>
      {lastReward?.id === 'first_world_signal_v1' && <RewardSummary receipt={lastReward} />}
    </ScrollView>
    <BottomNavigation />
  </SystemScreen>;
}
function Button({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityState={{ disabled }} style={[styles.button, disabled && { opacity: 0.4 }]}><Text style={styles.label}>{label}</Text></Pressable>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#030709' }, heading: { paddingHorizontal: 16, paddingBottom: 10 },
  title: { color: '#fff', fontSize: 23, fontWeight: '900' },
  label: { color: '#62efff', fontSize: 10, fontWeight: '900', letterSpacing: 0.7 },
  body: { color: '#c1d3df', fontSize: 11, marginTop: 5 }, small: { color: '#91a5b2', fontSize: 9, marginTop: 5 },
  error: { color: '#ffb791', fontSize: 11, marginTop: 5 }, map: { flex: 1, minHeight: 160, overflow: 'hidden' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#061017' },
  mapControls: { position: 'absolute', right: 8, top: 52, gap: 5 }, hud: { padding: 12 },
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginVertical: 8 },
  button: { backgroundColor: '#0b2630', borderRadius: 6, padding: 12 },
});
