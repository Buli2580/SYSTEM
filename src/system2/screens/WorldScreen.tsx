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
import { SYSTEM_COLORS as C } from '../core';
import SystemAmbientBackground from '../components/SystemAmbientBackground';
import {worldBossMode} from '../beta/worldBoss';

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
      <Text style={pageStyles.label}>ŚWIAT ZABLOKOWANY</Text>
      <Text style={pageStyles.body}>Ukończ Przebudzenie, aby odblokować SYSTEM WORLD.</Text>
      <Pressable onPress={() => router.replace('/quests')}><Text style={pageStyles.link}>PRZEJDŹ DO QUESTÓW →</Text></Pressable>
    </View>
  </SystemPage>;
  return <OnlineWorld />;
}
function OnlineWorld() {
  const router = useRouter();
  const { player, lastReward, story } = useSystem();
  const mode=worldBossMode({worldUnlocked:true,bossActive:!!story?.worldLinkComplete&&!story?.bossComplete,bossDefeated:!!story?.bossComplete});
  const world = useWorldTracking();
  const insets = useSafeAreaInsets();
  const [follow, setFollow] = useState(true);
  const [centerRequest, setCenterRequest] = useState(0);
  const active = world.status === 'ACTIVE';
  const signalState = world.signal?.status ?? 'LOCKED';
  return <SystemScreen style={[styles.root, { paddingTop: 10, paddingBottom: 110 + insets.bottom }]}>
    <SystemAmbientBackground intensity="world" />
    <View style={styles.heading}>
      <Text style={styles.title}>SYSTEM WORLD</Text><Text style={styles.label}>WORLD/BOSS 2.0 // {mode}</Text><Text style={styles.label}>STATUS ŚWIATA: ONLINE</Text>
      <Text style={styles.body}>EKSPLORACJA ŚWIATA · ODKRYTE SEKTORY {world.sectorIds.length}</Text>
      <Text style={styles.body}>ŁĄCZNY DYSTANS {(player.totalDistanceMeters / 1000).toFixed(2)} KM · ZWERYFIKOWANE MISJE</Text>
    </View>
    {mode==='BOSS'&&<Pressable onPress={()=>router.push('/story')} style={styles.bossSignal}><Text style={styles.bossSignalCode}>THREAT DETECTED // BOSS PROTOCOL</Text><Text style={styles.bossSignalTitle}>THE FIRST WALL</Text><Text style={styles.bossSignalCta}>WEJDŹ DO WALKI →</Text></Pressable>}
    <View style={styles.map}>
      {world.fix ? <WorldMap fix={world.fix} sectorIds={world.sectorIds} signal={world.signal} follow={follow} centerRequest={centerRequest} /> :
        <View style={styles.empty}><Text style={styles.label}>{world.status === 'STARTING' ? 'URUCHAMIANIE // GPS' : 'URUCHOM ŚWIAT'}</Text>
          <Text style={styles.body}>Mapa świata działa podczas otwartego ekranu WORLD. Aktywne misje ruchowe mogą mierzyć dystans w tle.</Text></View>}
      <View style={styles.mapControls}>
        <Button label="WYŚRODKUJ" disabled={!world.fix} onPress={() => setCenterRequest(n => n + 1)} />
        <Button label={`ŚLEDŹ GRACZA ${follow ? 'WŁ.' : 'WYŁ.'}`} onPress={() => setFollow(value => !value)} />
      </View>
      <DiscoveryToast text={world.feedback} id={world.feedbackId} />
    </View>
    <ScrollView style={{ maxHeight: 260 }} contentContainerStyle={styles.hud}>
      <Text style={styles.label}>GPS {world.status} · {world.fix ? `±${Math.round(world.fix.coords.accuracy ?? 0)} M` : '--'}</Text>
      <Text style={styles.small}>SEKTOR GRACZA {world.fix ? locationToSector(world.fix.coords) : '--'} · GRACZ ● TURKUS</Text>
      <Text style={styles.body}>{signalState === 'LOCATED' ? 'NIEZNANY SYGNAŁ ZLOKALIZOWANY' : `PIERWSZY SYGNAŁ: ${signalState}`}
        {world.signal && world.fix && signalState !== 'LOCATED' ? ` · ${Math.round(signalDistance(world.fix, world.signal))} M` : ''}</Text>
      {world.signal?.status === 'DETECTED' && <Text style={styles.small}>SYGNAŁ WYKRYTY · SYGNAŁ PROTOTYPOWY ● FIOLET</Text>}
      {world.signalError && <Text style={styles.error}>Nieprawidłowy zapis sygnału. Użyj opcji „Przenieś sygnał” po uruchomieniu GPS.</Text>}
      {world.error && <Text style={styles.error}>{world.error}</Text>}
      <View style={styles.actions}>
        {active ? <Button label="WSTRZYMAJ GPS" onPress={world.pause} /> : <Button label={world.status === 'STARTING' ? 'URUCHAMIANIE…' : world.status === 'PAUSED' ? 'URUCHOM ŚWIAT' : 'SPRÓBUJ PONOWNIE'} disabled={world.status === 'STARTING'} onPress={() => { void world.start(); }} />}
        {world.permanentDenial && <Button label="USTAWIENIA" onPress={() => { void Linking.openSettings().catch(() => undefined); }} />}
        {signalState !== 'LOCATED' && <Button label={world.scanning ? 'SKANOWANIE…' : world.signal || world.signalError ? 'PRZENIEŚ SYGNAŁ' : 'SZUKAJ SYGNAŁU'} disabled={!active || world.scanning} onPress={() => { void world.scan(Boolean(world.signal || world.signalError)); }} />}
      </View>
      <Text style={styles.small}>Nie wchodź na teren prywatny ani w miejsca, które mogą być niebezpieczne.</Text>
      {lastReward?.id === 'first_world_signal_v1' && <RewardSummary receipt={lastReward} />}
    </ScrollView>
    <BottomNavigation />
  </SystemScreen>;
}
function Button({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} style={({ pressed }) => [styles.button, disabled && styles.buttonDisabled, pressed && styles.buttonPressed]}><Text style={styles.label}>{label}</Text></Pressable>;
}
const styles = StyleSheet.create({
  bossSignal:{marginHorizontal:16,marginBottom:10,padding:16,borderWidth:1,borderColor:'rgba(228,186,255,0.48)',borderRadius:16,backgroundColor:'rgba(35,13,45,0.72)'},bossSignalCode:{color:'#e4baff',fontSize:9,fontWeight:'900',letterSpacing:1.5},bossSignalTitle:{color:'#fff',fontSize:22,fontWeight:'900',marginTop:6},bossSignalCta:{color:'#6ceeff',fontSize:10,fontWeight:'900',marginTop:10},
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
  lockedWorldHero: { height: 250, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  lockedWorldRingOuter: { position: 'absolute', width: 210, height: 210, borderRadius: 105, borderWidth: 1, borderColor: 'rgba(0,229,255,0.16)' },
  lockedWorldRingInner: { position: 'absolute', width: 142, height: 142, borderRadius: 71, borderWidth: 1, borderColor: 'rgba(0,229,255,0.28)', transform: [{ rotate: '45deg' }] },
  lockedWorldNode: { width: 72, height: 72, borderRadius: 36, borderWidth: 1, borderColor: C.cyan, backgroundColor: 'rgba(3,7,9,0.86)', alignItems: 'center', justifyContent: 'center' },
  lockedWorldDiamond: { width: 24, height: 24, borderWidth: 1, borderColor: C.cyanSoft, transform: [{ rotate: '45deg' }] },
  lockedWorldCode: { position: 'absolute', bottom: 18, color: C.textMuted, fontSize: 9, fontWeight: '900', letterSpacing: 2 },
});
