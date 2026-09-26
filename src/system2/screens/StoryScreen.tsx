import { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import SystemPage, { pageStyles as s } from '../components/SystemPage';
import Action from '../components/Action';
import { useSystem } from '../state/SystemProvider';
import { BOSS_FOCUS, BOSS_WALK, BOSS_RUN, ARC, STORY_REWARDS } from '../story/catalog';
import type { StoryEvent } from '../story/types';
import { loadChronicle, startBossProtocol } from '../storage/database';
import { awaitWithTimeout } from '../storage/awaitWithTimeout';
import { playSceneMusic, stopMusic } from '../identity/audio';
export default function StoryScreen() {
 const {story,refreshPlayer}=useSystem(),router=useRouter();
 const [entries,setEntries]=useState<StoryEvent[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const lock=useRef(false),epoch=useRef(0);
 useFocusEffect(useCallback(()=>{const id=++epoch.current;void awaitWithTimeout(loadChronicle()).then(value=>{if(id===epoch.current)setEntries(value);}).catch(()=>{if(id===epoch.current)setError('Nie udało się odczytać Chronicle. Otwórz ekran ponownie.');});return()=>{epoch.current++;};},[story]));
 const open=(questId:string)=>router.push({pathname:'/quest',params:{questId}});
 const boss=story?.boss;
 const bossStages=boss?[boss.focus_at,boss.move_at,boss.discipline_at].filter(Boolean).length:0;
 const bossHp=Math.max(0,100-Math.round(bossStages*100/3));
 const bossPhase=bossHp<=0?'VICTORY':bossHp<=34?'FINAL PHASE':bossHp<=67?'RAGE PHASE':'PHASE I';
 useFocusEffect(useCallback(()=>{ playSceneMusic(story?.worldLinkComplete&&!story?.bossComplete?'BOSS':'HOME'); return stopMusic; },[story?.worldLinkComplete,story?.bossComplete]));
 return <SystemPage title="STORY / CHRONICLE" subtitle={`ARC 01 // ${ARC.title}`}>
  <Text style={s.label}>ARC PROGRESS · {story?.chapters.filter(c=>c.status==='COMPLETED').length??0}/2 COMPLETE</Text>
  {story?.chapters.map(c=><View key={c.id} style={s.panel}><Text style={s.label}>CHAPTER {String(c.number).padStart(2,'0')} // {c.status}</Text><Text style={s.title}>{c.title}</Text><Text style={s.body}>{c.description} · {c.completed}/{c.total}</Text>
   {c.number===1?<Action label="AWAKENING QUESTS →" onPress={()=>router.push('/quests')}/>:<>
    <Text style={s.body}>{story.milestones.sectors?'✓':'○'} DISCOVER THE WORLD · 3 sektory</Text><Text style={s.body}>{story.milestones.signal?'✓':'○'} UNKNOWN SIGNAL</Text><Text style={s.body}>{story.milestones.dailyClear?'✓':'○'} DAILY CLEAR</Text>
    <Text style={s.label}>+{STORY_REWARDS.worldLink.realXp} REAL XP · +{STORY_REWARDS.worldLink.skillXp.RES} RES XP · +{STORY_REWARDS.worldLink.gameEnergy} ENERGY · PATHFINDER</Text>
    <Action label="SYSTEM WORLD →" disabled={c.status==='LOCKED'} onPress={()=>router.push('/world')}/><Action label="DAILY PROTOCOL →" disabled={c.status==='LOCKED'} onPress={()=>router.push('/quests')}/>
   </>}
  </View>)}
  <View style={bossStyles.arena}><View style={bossStyles.threatGlow}/><Text style={bossStyles.code}>BOSS PROTOCOL // {bossPhase}</Text><Text style={bossStyles.name}>THE FIRST WALL</Text><View style={bossStyles.silhouette}><View style={bossStyles.head}/><View style={bossStyles.body}/></View><View style={bossStyles.hpTrack}><View style={[bossStyles.hpFill,{width:`${bossHp}%`}]}/></View><Text style={bossStyles.hpLabel}>HP {bossHp}/100 · DAMAGE FROM VERIFIED REAL TASKS</Text></View>
  <View style={s.panel}><Text style={s.label}>BOSS PROTOCOL // {story?.bossComplete?'DEFEATED':story?.worldLinkComplete?'AVAILABLE':'LOCKED'}</Text><Text style={s.title}>THE FIRST WALL</Text>
   <Text style={s.body}>FOCUS → MOVE → DISCIPLINE. Postęp etapów zostaje zapisany.</Text>
   {story?.worldLinkComplete&&!boss&&<Action label="BEGIN BOSS PROTOCOL" disabled={busy} onPress={()=>{if(lock.current)return;lock.current=true;setBusy(true);setError('');const request=epoch.current;void awaitWithTimeout(startBossProtocol()).then(()=>refreshPlayer()).catch(()=>{if(request===epoch.current)setError('Nie udało się rozpocząć Bossa. Sprawdź datę i ponów próbę.');}).finally(()=>{lock.current=false;if(request===epoch.current)setBusy(false);});}}/>}
   {boss&&<>
    <Text style={s.body}>STAGE 1 // {boss.focus_at?'COMPLETED':'AVAILABLE'} · 15 MIN FOCUS</Text>
    {!boss.focus_at&&<Action label="BEGIN FOCUS" onPress={()=>open(BOSS_FOCUS)}/>}
    <Text style={s.body}>STAGE 2 // {boss.move_at?'COMPLETED':boss.focus_at?'AVAILABLE':'LOCKED'} · 2 KM MOVE</Text>
    {!!boss.focus_at&&!boss.move_at&&<><Action label="WALK 2 KM" onPress={()=>open(BOSS_WALK)}/><Action label="RUN 2 KM" onPress={()=>open(BOSS_RUN)}/></>}
    <Text style={s.body}>STAGE 3 // {boss.discipline_at?'COMPLETED':boss.move_at?'AVAILABLE':'LOCKED'}</Text>
    <Text style={s.body}>Ukończ Daily po Stage 2, najwcześniej następnego dnia od startu Bossa ({boss.start_day}). Późniejszy dzień również się liczy.</Text>
    {!!boss.move_at&&!boss.discipline_at&&<Action label="DAILY QUESTS →" onPress={()=>router.push('/quests')}/>}
   </>}
   {story?.bossComplete&&<Text style={s.title}>VICTORY // BOSS DEFEATED // LOOT STORED</Text>}
   <Text style={s.label}>+{STORY_REWARDS.boss.realXp} REAL XP · +{STORY_REWARDS.boss.skillXp.WIL} WIL XP · +{STORY_REWARDS.boss.skillXp.VIT} VIT XP · +{STORY_REWARDS.boss.gameEnergy} ENERGY · WALLBREAKER</Text>
  </View>
  <View style={s.panel}><Text style={s.label}>CHAPTER 03 // UNKNOWN // LOCKED</Text></View>
  {!!error&&<Text style={s.body}>{error}</Text>}
  <Text style={s.title}>CHRONICLE</Text>
    {entries.length === 0 ? <View style={s.panel}><Text style={s.body}>Chronicle zacznie się od pierwszego wydarzenia fabularnego.</Text></View> : entries.map(event=><View key={event.id} style={s.panel}><Text style={s.label}>{event.type.replaceAll('_',' ')}</Text><Text style={s.title}>{event.title}</Text>{!!event.subtitle&&<Text style={s.body}>{event.subtitle}</Text>}<Text style={s.body}>{new Date(event.created_at).toLocaleString()}</Text></View>)}
 </SystemPage>;
}

const bossStyles=StyleSheet.create({arena:{position:'relative',overflow:'hidden',marginVertical:14,minHeight:390,borderWidth:1,borderColor:'rgba(255,88,76,.34)',backgroundColor:'#070609',padding:22},threatGlow:{position:'absolute',width:260,height:260,borderRadius:130,backgroundColor:'rgba(180,30,42,.10)',top:20,alignSelf:'center'},code:{color:'#ff6a5e',fontSize:9,fontWeight:'900',letterSpacing:2.4},name:{color:'#fff',fontSize:34,fontWeight:'900',letterSpacing:1,marginTop:7},silhouette:{height:150,alignItems:'center',justifyContent:'flex-end'},head:{width:48,height:45,borderTopLeftRadius:22,borderTopRightRadius:22,backgroundColor:'#010203'},body:{width:126,height:92,borderTopLeftRadius:52,borderTopRightRadius:52,backgroundColor:'#010203'},hpTrack:{height:9,backgroundColor:'#241013',borderWidth:1,borderColor:'#4b1b20',overflow:'hidden'},hpFill:{height:'100%',backgroundColor:'#d53c43'},hpLabel:{color:'#ff8178',fontSize:8,fontWeight:'900',letterSpacing:1.6,marginTop:7,textAlign:'center'}});
