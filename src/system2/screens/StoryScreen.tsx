import { useCallback, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import SystemPage, { pageStyles as s } from '../components/SystemPage';
import Action from '../components/Action';
import { useSystem } from '../state/SystemProvider';
import { BOSS_FOCUS, BOSS_WALK, BOSS_RUN, ARC, STORY_REWARDS } from '../story/catalog';
import type { StoryEvent } from '../story/types';
import { loadChronicle, startBossProtocol } from '../storage/database';
import { awaitWithTimeout } from '../storage/awaitWithTimeout';
export default function StoryScreen() {
 const {story,refreshPlayer}=useSystem(),router=useRouter();
 const [entries,setEntries]=useState<StoryEvent[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const lock=useRef(false),epoch=useRef(0);
 useFocusEffect(useCallback(()=>{const id=++epoch.current;void awaitWithTimeout(loadChronicle()).then(value=>{if(id===epoch.current)setEntries(value);}).catch(()=>{if(id===epoch.current)setError('Nie udało się odczytać Chronicle. Otwórz ekran ponownie.');});return()=>{epoch.current++;};},[story]));
 const open=(questId:string)=>router.push({pathname:'/quest',params:{questId}});
 const boss=story?.boss;
 return <SystemPage title="STORY / CHRONICLE" subtitle={`ARC 01 // ${ARC.title}`}>
  <Text style={s.label}>ARC PROGRESS · {story?.chapters.filter(c=>c.status==='COMPLETED').length??0}/2 COMPLETE</Text>
  {story?.chapters.map(c=><View key={c.id} style={s.panel}><Text style={s.label}>CHAPTER {String(c.number).padStart(2,'0')} // {c.status}</Text><Text style={s.title}>{c.title}</Text><Text style={s.body}>{c.description} · {c.completed}/{c.total}</Text>
   {c.number===1?<Action label="AWAKENING QUESTS →" onPress={()=>router.push('/quests')}/>:<>
    <Text style={s.body}>{story.milestones.sectors?'✓':'○'} DISCOVER THE WORLD · 3 sektory</Text><Text style={s.body}>{story.milestones.signal?'✓':'○'} UNKNOWN SIGNAL</Text><Text style={s.body}>{story.milestones.dailyClear?'✓':'○'} DAILY CLEAR</Text>
    <Text style={s.label}>+{STORY_REWARDS.worldLink.realXp} REAL XP · +{STORY_REWARDS.worldLink.skillXp.RES} RES XP · +{STORY_REWARDS.worldLink.gameEnergy} ENERGY · PATHFINDER</Text>
    <Action label="SYSTEM WORLD →" disabled={c.status==='LOCKED'} onPress={()=>router.push('/world')}/><Action label="DAILY PROTOCOL →" disabled={c.status==='LOCKED'} onPress={()=>router.push('/quests')}/>
   </>}
  </View>)}
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
   <Text style={s.label}>+{STORY_REWARDS.boss.realXp} REAL XP · +{STORY_REWARDS.boss.skillXp.WIL} WIL XP · +{STORY_REWARDS.boss.skillXp.VIT} VIT XP · +{STORY_REWARDS.boss.gameEnergy} ENERGY · WALLBREAKER</Text>
  </View>
  <View style={s.panel}><Text style={s.label}>CHAPTER 03 // UNKNOWN // LOCKED</Text></View>
  {!!error&&<Text style={s.body}>{error}</Text>}
  <Text style={s.title}>CHRONICLE</Text>
  {entries.map(event=><View key={event.id} style={s.panel}><Text style={s.label}>{event.type.replaceAll('_',' ')}</Text><Text style={s.title}>{event.title}</Text>{!!event.subtitle&&<Text style={s.body}>{event.subtitle}</Text>}<Text style={s.body}>{new Date(event.created_at).toLocaleString()}</Text></View>)}
 </SystemPage>;
}
