import { useCallback, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import SystemPage, { pageStyles as s } from '../components/SystemPage';
import Action from '../components/Action';
import { useSystem } from '../state/SystemProvider';
import { storyEventTypePl } from '../i18n/pl';
import { bossQuest, BOSS_FOCUS, BOSS_WALK, BOSS_RUN, ARC, STORY_REWARDS } from '../story/catalog';
import type { StoryEvent } from '../story/types';
import { loadChronicle, startBossProtocol } from '../storage/database';
import { awaitWithTimeout } from '../storage/awaitWithTimeout';
export default function StoryScreen() {
 const {story,refreshPlayer}=useSystem(),router=useRouter();
 const [entries,setEntries]=useState<StoryEvent[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const lock=useRef(false),epoch=useRef(0);
 useFocusEffect(useCallback(()=>{const id=++epoch.current;void awaitWithTimeout(loadChronicle()).then(value=>{if(id===epoch.current)setEntries(value);}).catch(()=>{if(id===epoch.current)setError('Nie udało się odczytać kroniki. Otwórz ekran ponownie.');});return()=>{epoch.current++;};},[story]));
 const open=(questId:string)=>router.push({pathname:'/quest',params:{questId}});
 const boss=story?.boss;
 const focusMinutes=bossQuest(BOSS_FOCUS,boss?.difficulty)!.progressTarget/60;
 const moveKm=bossQuest(BOSS_WALK,boss?.difficulty)!.progressTarget/1000;
 return <SystemPage title="HISTORIA / KRONIKA" subtitle={`AKT 01 // ${ARC.title}`}>
  <Text style={s.label}>POSTĘP AKTU · {story?.chapters.filter(c=>c.status==='COMPLETED').length??0}/2 UKOŃCZONE</Text>
  {story?.chapters.map(c=><View key={c.id} style={s.panel}><Text style={s.label}>ROZDZIAŁ {String(c.number).padStart(2,'0')} // {c.status === 'COMPLETED' ? 'UKOŃCZONY' : c.status === 'ACTIVE' ? 'AKTYWNY' : c.status === 'AVAILABLE' ? 'DOSTĘPNY' : 'ZABLOKOWANY'}</Text><Text style={s.title}>{c.title}</Text><Text style={s.body}>{c.description} · {c.completed}/{c.total}</Text>
   {c.number===1?<Action label="MISJE PRZEBUDZENIA →" onPress={()=>router.push('/quests')}/>:<>
    <Text style={s.body}>{story.milestones.sectors?'✓':'○'} ODKRYJ ŚWIAT · 3 sektory</Text><Text style={s.body}>{story.milestones.signal?'✓':'○'} NIEZNANY SYGNAŁ</Text><Text style={s.body}>{story.milestones.dailyClear?'✓':'○'} UKOŃCZONY DZIEŃ</Text>
    <Text style={s.label}>+{STORY_REWARDS.worldLink.realXp} REAL XP · +{STORY_REWARDS.worldLink.skillXp.RES} RES XP · +{STORY_REWARDS.worldLink.gameEnergy} ENERGII · ODKRYWCA</Text>
    <Action label="SYSTEM WORLD →" disabled={c.status==='LOCKED'} onPress={()=>router.push('/world')}/><Action label="PROTOKÓŁ DZIENNY →" disabled={c.status==='LOCKED'} onPress={()=>router.push('/quests')}/>
   </>}
  </View>)}
  <View style={s.panel}><Text style={s.label}>PROTOKÓŁ BOSSA // {story?.bossComplete?'POKONANY':story?.worldLinkComplete?'DOSTĘPNY':'ZABLOKOWANE'}</Text><Text style={s.title}>PIERWSZY MUR</Text>
   <Text style={s.body}>SKUPIENIE → RUCH → DYSCYPLINA. Postęp etapów jest zapisywany.</Text>
   {story?.worldLinkComplete&&!boss&&<Action label="ROZPOCZNIJ PROTOKÓŁ BOSSA" disabled={busy} onPress={()=>{if(lock.current)return;lock.current=true;setBusy(true);setError('');const request=epoch.current;void awaitWithTimeout(startBossProtocol()).then(()=>refreshPlayer()).catch(()=>{if(request===epoch.current)setError('Nie udało się rozpocząć Bossa. Sprawdź datę i ponów próbę.');}).finally(()=>{lock.current=false;if(request===epoch.current)setBusy(false);});}}/>}
   {boss&&<>
    <Text style={s.body}>ETAP 1 // {boss.focus_at?'UKOŃCZONE':'DOSTĘPNY'} · {focusMinutes} MIN SKUPIENIA</Text>
    {!boss.focus_at&&<Action label="ROZPOCZNIJ SKUPIENIE" onPress={()=>open(BOSS_FOCUS)}/>}
    <Text style={s.body}>ETAP 2 // {boss.move_at?'UKOŃCZONE':boss.focus_at?'DOSTĘPNY':'ZABLOKOWANE'} · {moveKm} KM RUCHU</Text>
    {!!boss.focus_at&&!boss.move_at&&<><Action label={`PRZEJDŹ ${moveKm} KM`} onPress={()=>open(BOSS_WALK)}/><Action label={`PRZEBIEGNIJ ${moveKm} KM`} onPress={()=>open(BOSS_RUN)}/></>}
    <Text style={s.body}>ETAP 3 // {boss.discipline_at?'UKOŃCZONE':boss.move_at?'DOSTĘPNY':'ZABLOKOWANE'}</Text>
    <Text style={s.body}>Ukończ misję dzienną po etapie 2, najwcześniej następnego dnia od rozpoczęcia Bossa ({boss.start_day}). Późniejszy dzień również się liczy.</Text>
    {!!boss.move_at&&!boss.discipline_at&&<Action label="MISJE DZIENNE →" onPress={()=>router.push('/quests')}/>}
   </>}
   <Text style={s.label}>+{STORY_REWARDS.boss.realXp} REAL XP · +{STORY_REWARDS.boss.skillXp.WIL} WIL XP · +{STORY_REWARDS.boss.skillXp.VIT} VIT XP · +{STORY_REWARDS.boss.gameEnergy} ENERGII · POGROMCA MURU</Text>
  </View>
  <View style={s.panel}><Text style={s.label}>ROZDZIAŁ 03 // NIEZNANY // ZABLOKOWANY</Text></View>
  {!!error&&<Text style={s.body}>{error}</Text>}
  <Text style={s.title}>KRONIKA</Text>
    {entries.length === 0 ? <View style={s.panel}><Text style={s.body}>Chronicle zacznie się od pierwszego wydarzenia fabularnego.</Text></View> : entries.map(event=><View key={event.id} style={s.panel}><Text style={s.label}>{storyEventTypePl(event.type)}</Text><Text style={s.title}>{event.title}</Text>{!!event.subtitle&&<Text style={s.body}>{event.subtitle}</Text>}<Text style={s.body}>{new Date(event.created_at).toLocaleString()}</Text></View>)}
 </SystemPage>;
}
