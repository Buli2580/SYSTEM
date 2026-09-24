import SystemScreen from '../components/SystemScreen';
import { useEffect, useState } from 'react';
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
import SystemAudioScene from '../components/SystemAudioScene';
import {activeWorldEvent} from '../world/events';
import WorldEventHUD from '../components/WorldEventHUD';

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
  const { player, story } = useSystem();
  const [clock,setClock]=useState(()=>Date.now());
  useEffect(()=>{const timer=setInterval(()=>setClock(Date.now()),30000);return()=>clearInterval(timer)},[]);
  const mode=worldBossMode({worldUnlocked:true,bossActive:!!story?.worldLinkComplete&&!story?.bossComplete,bossDefeated:!!story?.bossComplete});
  const world = useWorldTracking();
  const insets = useSafeAreaInsets();
  const [follow, setFollow] = useState(true);
  const [centerRequest, setCenterRequest] = useState(0);
  const active = world.status === 'ACTIVE';
  const signalState = world.signal?.status ?? 'LOCKED';
  const worldEvent=activeWorldEvent(player,true,clock);
  return <SystemScreen style={[styles.root, { paddingTop: 10, paddingBottom: 110 + insets.bottom }]}>
    <SystemAmbientBackground intensity="world" screen={mode==="BOSS"?"BOSS":"WORLD"} scene={mode==="BOSS"?"BOSS_ZONE":"WORLD"} threat={mode==="BOSS"?3:1} level={player.realLevel} />
    <SystemAudioScene cue={mode==="BOSS"?"BOSS":"WORLD"} />
    <View style={styles.heading}>
      <Text style={styles.title}>SYSTEM WORLD</Text><Text style={styles.label}>WORLD/BOSS 2.0 // {mode}</Text><Text style={styles.label}>STATUS ŚWIATA: ONLINE</Text>
      <Text style={styles.body}>EKSPLORACJA ŚWIATA · ODKRYTE SEKTORY {world.sectorIds.length}</Text>
      <Text style={styles.body}>ŁĄCZNY DYSTANS {(player.totalDistanceMeters / 1000).toFixed(2)} KM · ZWERYFIKOWANE MISJE</Text>
    </View>
    {mode==='BOSS'&&<Pressable onPress={()=>router.push('/story')} style={styles.bossSignal}><Text style={styles.bossSignalCode}>THREAT DETECTED // BOSS PROTOCOL</Text><Text style={styles.bossSignalTitle}>THE FIRST WALL</Text><Text style={styles.bossSignalCta}>WEJDŹ DO WALKI →</Text></Pressable>}
    {worldEvent&&<View style={{paddingHorizontal:16,marginBottom:10}}>
      <WorldEventHUD event={worldEvent} now={clock} onAction={()=>{
        if(worldEvent.recommendedAction==='BOSS'){router.push('/story');return;}
        if(worldEvent.recommendedAction==='MOVE'){router.push('/move');return;}
        if(worldEvent.recommendedAction==='FOCUS'){router.push('/quests');return;}
        setCenterRequest(n=>n+1);
      }}/>
      <Text style={styles.eventDisclaimer}>EVENT HUD // wizualizacja aktywnego okna. Nagroda pojawi się dopiero po kanonicznie zweryfikowanej aktywności.</Text>
    </View>}
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
    </ScrollView>
    <BottomNavigation />
  </SystemScreen>;
}
function Button({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} style={({ pressed }) => [styles.button, disabled && styles.buttonDisabled, pressed && styles.buttonPressed]}><Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.78} style={styles.buttonLabel}>{label}</Text></Pressable>;
}
const styles = StyleSheet.create({
  eventDisclaimer:{color:'#6f8791',fontSize:8,lineHeight:12,marginTop:6},
  bossSignal:{marginHorizontal:16,marginBottom:10,padding:16,borderWidth:1,borderColor:'rgba(228,186,255,0.48)',borderRadius:16,backgroundColor:'rgba(35,13,45,0.72)'},bossSignalCode:{color:'#e4baff',fontSize:9,lineHeight:14,fontWeight:'900',letterSpacing:1.2,flexShrink:1},bossSignalTitle:{color:'#fff',fontSize:22,lineHeight:28,fontWeight:'900',marginTop:6,flexShrink:1},bossSignalCta:{color:'#6ceeff',fontSize:10,lineHeight:15,fontWeight:'900',marginTop:10,flexShrink:1},
  eventCard:{marginHorizontal:16,marginBottom:10,padding:14,borderWidth:1,borderColor:'rgba(108,238,255,.34)',borderRadius:16,backgroundColor:'rgba(6,20,27,.9)'},
  eventTop:{flexDirection:'row',justifyContent:'space-between',gap:10},
  eventCode:{flex:1,minWidth:0,color:'#6ceeff',fontSize:8,lineHeight:12,fontWeight:'900',letterSpacing:1},
  eventTimer:{color:'#ffcf6a',fontSize:8,fontWeight:'900',flexShrink:0},
  eventTitle:{color:'#fff',fontSize:18,lineHeight:23,fontWeight:'900',marginTop:7},
  eventBody:{color:'#9fb4bd',fontSize:10,lineHeight:15,marginTop:5},
  eventMeta:{color:'#6f8791',fontSize:8,lineHeight:12,fontWeight:'900',letterSpacing:.7,marginTop:8},
  root: { flex: 1, backgroundColor: C.background }, heading: { paddingHorizontal: 16, paddingBottom: 10 },
  title: { color: C.white, fontSize: 23, lineHeight: 29, fontWeight: '900', flexShrink: 1 },
  label: { color: C.cyan, fontSize: 10, lineHeight: 15, fontWeight: '900', letterSpacing: 0.6, flexShrink: 1 },
  buttonLabel: { color: C.cyan, fontSize: 10, lineHeight: 14, fontWeight: '900', letterSpacing: 0.45, textAlign: 'center', flexShrink: 1 },
  body: { color: C.text, fontSize: 11, lineHeight: 17, marginTop: 5, flexShrink: 1 }, small: { color: C.textMuted, fontSize: 9, lineHeight: 14, marginTop: 5, flexShrink: 1 },
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
