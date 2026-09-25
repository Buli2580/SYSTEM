import SystemScreen from '../components/SystemScreen';
import RewardSummary from '../components/RewardSummary';
import { useState } from 'react';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
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
import { SYSTEM_COLORS as C } from '../core';
import SystemAmbientBackground from '../components/SystemAmbientBackground';

export default function WorldScreen() {
  const router = useRouter();
  const { ready, worldUnlocked } = useSystem();
  // Do not mount the tracking hook/map until the persisted unlock is ready.
  if (!ready || !worldUnlocked) return <SystemPage title="SYSTEM WORLD" subtitle="WORLD PROTOCOL" intensity="world">
    <View style={styles.lockedWorldHero}>
      <View style={styles.lockedWorldRingOuter} />
      <View style={styles.lockedWorldRingInner} />
      <View style={styles.lockedWorldNode}><View style={styles.lockedWorldDiamond} /></View>
      <Text style={styles.lockedWorldCode}>PROTOCOL // SEALED</Text>
    </View>
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
    <SystemAmbientBackground intensity="world" />
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
  return <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} style={({ pressed }) => [styles.button, disabled && styles.buttonDisabled, pressed && styles.buttonPressed]}><Text style={styles.label}>{label}</Text></Pressable>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background }, heading: { paddingHorizontal: 16, paddingBottom: 10 },
  title: { color: C.white, fontSize: 23, fontWeight: '900' },
  label: { color: C.cyan, fontSize: 10, fontWeight: '900', letterSpacing: 0.7 },
  body: { color: C.text, fontSize: 11, marginTop: 5 }, small: { color: C.textMuted, fontSize: 9, marginTop: 5 },
  error: { color: C.warning, fontSize: 11, marginTop: 5 }, map: { flex: 1, minHeight: 160, overflow: 'hidden' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.panel },
  mapControls: { position: 'absolute', right: 8, top: 52, gap: 5 }, hud: { padding: 12 },
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginVertical: 8 },
  button: { minHeight: 48, justifyContent: 'center', backgroundColor: C.panelSoft, borderColor: C.line, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12 },
  buttonDisabled: { opacity: 0.4 }, buttonPressed: { opacity: 0.75 },
  lockedWorldHero: { height: 250, alignItems: 'center', justifyContent: 'flex-end', position: 'relative', overflow:'hidden', backgroundColor:'#03070b' },
  lockedSky:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(12,32,45,.32)'},
  lockedTower:{position:'absolute',bottom:0,width:48,backgroundColor:'#05090d',borderTopWidth:1,borderColor:'rgba(75,181,211,.12)'},
  lockedGate:{position:'absolute',bottom:38,width:88,height:150,borderWidth:1,borderColor:'rgba(75,215,255,.35)',backgroundColor:'rgba(18,87,111,.10)',alignItems:'center',justifyContent:'center'},
  lockedGateMark:{color:C.cyan,fontSize:42,fontWeight:'200',opacity:.55},
  worldCode:{color:C.cyan,fontSize:8,fontWeight:'900',letterSpacing:2.2,marginBottom:5},
  worldStats:{flexDirection:'row',justifyContent:'space-between',marginTop:12,borderTopWidth:1,borderColor:C.line,paddingTop:10},
  statValue:{color:C.white,fontSize:15,fontWeight:'900'},
  statLabel:{color:C.textMuted,fontSize:7,fontWeight:'900',letterSpacing:1.2,marginTop:2},
  regionTitle:{color:C.white,fontSize:15,fontWeight:'900',letterSpacing:1,marginBottom:8},
  lockedWorldRingOuter: { position: 'absolute', width: 210, height: 210, borderRadius: 105, borderWidth: 1, borderColor: 'rgba(0,229,255,0.16)' },
  lockedWorldRingInner: { position: 'absolute', width: 142, height: 142, borderRadius: 71, borderWidth: 1, borderColor: 'rgba(0,229,255,0.28)', transform: [{ rotate: '45deg' }] },
  lockedWorldNode: { width: 72, height: 72, borderRadius: 36, borderWidth: 1, borderColor: C.cyan, backgroundColor: 'rgba(3,7,9,0.86)', alignItems: 'center', justifyContent: 'center' },
  lockedWorldDiamond: { width: 24, height: 24, borderWidth: 1, borderColor: C.cyanSoft, transform: [{ rotate: '45deg' }] },
  lockedWorldCode: { position: 'absolute', bottom: 18, color: C.textMuted, fontSize: 9, fontWeight: '900', letterSpacing: 2 },
});
