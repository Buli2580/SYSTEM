import { useEffect, useRef, useState } from 'react';
import { Text, TextInput, View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import SystemPage, { pageStyles as s } from '../components/SystemPage';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Action from '../components/Action';
import IdentityAvatar from '../components/IdentityAvatar';
import SystemError from '../components/SystemError';
import { useSystem } from '../state/SystemProvider';
import { SKILL_KEYS, SKILL_META, type SkillKey } from '../core';
import { dominantSkill } from '../identity/model';
import { persistAvatar, removeOwnedAvatar } from '../identity/avatar';

export default function CharacterScreen() {
  const { player, titles, updateIdentity } = useSystem();
  const router = useRouter();
  const [name, setName] = useState(player.displayName), [selected, setSelected] = useState<SkillKey | null>(null);
  const [error, setError] = useState<string | null>(null), [busy, setBusy] = useState(false);
  const lock = useRef(false), mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => setName(player.displayName), [player.id, player.displayName]);
  const aura = useSharedValue(0.72);
  useEffect(() => { aura.value = withRepeat(withSequence(withTiming(1, { duration: 1600 }), withTiming(0.72, { duration: 1600 })), -1); }, [aura]);
  const auraStyle = useAnimatedStyle(() => ({ opacity: aura.value, transform: [{ scale: 0.96 + aura.value * 0.06 }] }));
  async function run(task: () => Promise<void>) {
    if (lock.current) return; lock.current = true; setBusy(true); setError(null);
    try { await task(); } catch (cause) { if (__DEV__) console.error('[SYSTEM identity] Operation failed', cause); if (mounted.current) setError(cause instanceof Error ? cause.message : 'Nie udało się zapisać tożsamości.'); }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  async function chooseAvatar(camera: boolean) {
    if (camera) {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) throw new Error('Brak zgody na aparat. Zmień uprawnienia w ustawieniach aplikacji.');
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8, exif: false, base64: false };
    const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled || !mounted.current) return;
    const asset = result.assets[0];
    if (!asset?.uri) throw new Error('Nie otrzymano obrazu z galerii lub aparatu.');
    const uri = await persistAvatar(asset.uri);
    if (!mounted.current) { removeOwnedAvatar(uri); return; }
    // Do not delete a newly copied image on an ambiguous SQLite timeout: the
    // commit may still finish. Full reset removes the app-owned avatar directory.
    await updateIdentity({ avatarUri: uri });
    removeOwnedAvatar(player.avatarUri);
  }
  return <SystemPage title="POSTAĆ" subtitle="CHARACTER 3.0">
    <Animated.View entering={FadeIn.duration(450)} style={cs.hero}>
      <Animated.View pointerEvents="none" style={[cs.aura, auraStyle]} />
      <View style={cs.levelHud}><Text style={cs.kicker}>REAL LEVEL</Text><Text style={cs.level}>{player.realLevel}</Text><Text style={cs.rank}>RANK {player.rank}</Text></View>
      <View style={cs.characterStage}>
        <View style={cs.gearRail}>
          <GearSlot glyph="⚔" label="BROŃ" /><GearSlot glyph="◈" label="ARTEFAKT" /><GearSlot glyph="◇" label="DODATEK" />
        </View>
        <View style={cs.avatarStage}>
          <IdentityAvatar uri={player.avatarUri} evolution={player.avatarEvolution} />
          <Text style={cs.name}>{player.displayName}</Text><Text style={cs.title}>{player.currentTitle}</Text>
          <Text style={cs.meta}>EVOLUTION {player.avatarEvolution} · {dominantSkill(player)}</Text>
        </View>
        <View style={cs.gearRail}>
          <GearSlot glyph="⬡" label="PANCERZ" /><GearSlot glyph="◉" label="PIERŚCIEŃ" /><GearSlot glyph="✦" label="RELIKWIARZ" />
        </View>
      </View>
      <View style={cs.xp}><View style={[cs.xpFill,{width:`${Math.min(100, player.realXp / player.realXpToNextLevel * 100)}%`}]} /></View>
      <Text style={cs.xpText}>{player.realXp} / {player.realXpToNextLevel} REAL XP</Text>
    </Animated.View>

    <Animated.View entering={FadeInDown.delay(80)} style={cs.statField}>
      {SKILL_KEYS.map(key => { const skill=player.stats[key]; return <Pressable key={key} onPress={()=>setSelected(selected===key?null:key)} style={[cs.statNode, selected===key&&cs.statNodeActive]}>
        <Text style={cs.statKey}>{key}</Text><Text style={cs.statLevel}>{skill.level}</Text><Text style={cs.statName}>{SKILL_META[key].name}</Text>
        {selected===key&&<Text style={cs.statDetail}>{skill.xp}/{skill.xpToNextLevel} XP</Text>}
      </Pressable>; })}
    </Animated.View>

    <View style={cs.rpgNav}>
      <Pressable style={cs.rpgNavItem}><Text style={cs.navGlyph}>⌘</Text><Text style={cs.navText}>EKWIPUNEK</Text></Pressable>
      <Pressable style={cs.rpgNavItem}><Text style={cs.navGlyph}>✦</Text><Text style={cs.navText}>SKILL TREE</Text></Pressable>
      <View style={cs.rpgNavItem}><Text style={cs.navGlyph}>♛</Text><Text style={cs.navText}>TITLES</Text></View>
      <View style={cs.rpgNavItem}><Text style={cs.navGlyph}>◆</Text><Text style={cs.navText}>ACHIEVEMENTS</Text></View>
    </View>

    <View style={cs.identityDrawer}>
      <Text style={cs.drawerTitle}>IDENTITY // PROFILE</Text>
      <TextInput accessibilityLabel="Zmień SYSTEM NAME" value={name} onChangeText={setName} maxLength={24} style={cs.input} />
      <Action label="ZAPISZ SYSTEM NAME" disabled={busy} onPress={() => { void run(() => updateIdentity({ displayName: name })); }} />
      <Action label="AVATAR Z GALERII" disabled={busy} onPress={() => { void run(() => chooseAvatar(false)); }} />
      <Action label="ZRÓB ZDJĘCIE" disabled={busy} onPress={() => { void run(() => chooseAvatar(true)); }} />
      {error && <SystemError message={error} retry={() => setError(null)} />}
      <Text style={cs.drawerTitle}>TITLES</Text>
      {titles.map(title => <Action key={title} label={`${player.currentTitle===title?'✓ ':''}${title}`} disabled={busy} onPress={() => { void run(() => updateIdentity({ currentTitle: title })); }} />)}
      <Action label="SYSTEM LOG →" onPress={() => router.push('/system-log')} />
    </View>
  </SystemPage>;
}
function Progress({ value, max }: { value: number; max: number }) {
  return <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max, now: value }} style={{ width: '100%', height: 5, backgroundColor: '#17333e', borderRadius: 4, marginVertical: 12 }}>
    <View style={{ width: `${Math.min(100, value / max * 100)}%`, height: 5, backgroundColor: '#62efff', borderRadius: 4 }} />
  </View>;
}

function GearSlot({ glyph, label }: { glyph: string; label: string }) { return <View style={cs.gearSlot}><Text style={cs.gearGlyph}>{glyph}</Text><Text style={cs.gearLabel}>{label}</Text></View>; }
const cs=StyleSheet.create({
 hero:{minHeight:430,marginHorizontal:-12,marginTop:-8,overflow:'hidden',backgroundColor:'#03080D',borderBottomWidth:1,borderColor:'rgba(98,239,255,.25)',paddingTop:18},
 aura:{position:'absolute',alignSelf:'center',top:70,width:260,height:300,borderRadius:150,backgroundColor:'rgba(65,70,220,.12)',borderWidth:1,borderColor:'rgba(98,239,255,.18)',shadowColor:'#765CFF',shadowOpacity:.7,shadowRadius:36},
 levelHud:{alignItems:'center'},kicker:{color:'#62efff',fontSize:8,fontWeight:'900',letterSpacing:2},level:{color:'#fff',fontSize:38,fontWeight:'900'},rank:{color:'#b79cff',fontSize:12,fontWeight:'900',letterSpacing:2},
 characterStage:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:10},
 avatarStage:{alignItems:'center',flex:1},name:{color:'#fff',fontSize:18,fontWeight:'900',marginTop:12},title:{color:'#62efff',fontSize:10,fontWeight:'800',letterSpacing:1.2},meta:{color:'rgba(220,240,245,.45)',fontSize:7,fontWeight:'800',marginTop:6},
 gearRail:{gap:18},gearSlot:{width:62,height:62,borderWidth:1,borderColor:'rgba(98,239,255,.3)',backgroundColor:'rgba(3,12,18,.72)',alignItems:'center',justifyContent:'center'},gearGlyph:{color:'#dcefff',fontSize:21},gearLabel:{color:'#7fa5b1',fontSize:6,fontWeight:'900',marginTop:3},
 xp:{height:5,marginHorizontal:45,backgroundColor:'#10242d'},xpFill:{height:5,backgroundColor:'#62efff'},xpText:{color:'#7695a0',fontSize:7,textAlign:'center',marginTop:5,marginBottom:12},
 statField:{flexDirection:'row',flexWrap:'wrap',justifyContent:'center',gap:8,paddingVertical:16},statNode:{width:'29%',minHeight:78,borderWidth:1,borderColor:'#173944',backgroundColor:'#061015',alignItems:'center',justifyContent:'center',padding:6},statNodeActive:{borderColor:'#765CFF',backgroundColor:'rgba(70,50,150,.15)'},statKey:{color:'#62efff',fontSize:9,fontWeight:'900'},statLevel:{color:'#fff',fontSize:24,fontWeight:'900'},statName:{color:'#718d96',fontSize:6,fontWeight:'800',textAlign:'center'},statDetail:{color:'#b79cff',fontSize:7,marginTop:4},
 rpgNav:{flexDirection:'row',borderTopWidth:1,borderBottomWidth:1,borderColor:'#173944',paddingVertical:12},rpgNavItem:{flex:1,alignItems:'center'},navGlyph:{color:'#dcefff',fontSize:20},navText:{color:'#8ba8b2',fontSize:6,fontWeight:'900',marginTop:4},
 identityDrawer:{paddingTop:18},drawerTitle:{color:'#62efff',fontSize:9,fontWeight:'900',letterSpacing:1.6,marginVertical:10},input:{color:'#fff',minHeight:48,borderBottomWidth:1,borderBottomColor:'#417480'}
});