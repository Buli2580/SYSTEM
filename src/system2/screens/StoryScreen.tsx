import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import SystemPage, { pageStyles as s } from '../components/SystemPage';
import Action from '../components/Action';
import { useSystem } from '../state/SystemProvider';
import { storyEventTypePl } from '../i18n/pl';
import { BOSS_FOCUS, BOSS_WALK, BOSS_RUN, ARC, STORY_REWARDS } from '../story/catalog';
import type { StoryEvent } from '../story/types';
import { loadChronicle, startBossProtocol } from '../storage/database';
import { awaitWithTimeout } from '../storage/awaitWithTimeout';
import { bossPhaseState } from '../story/bossEngine';
export default function StoryScreen() {
 const {story,refreshPlayer}=useSystem(),router=useRouter();
 const [entries,setEntries]=useState<StoryEvent[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const lock=useRef(false),epoch=useRef(0),mounted=useRef(true);
 useEffect(()=>()=>{mounted.current=false;epoch.current++;},[]);
 const refreshChronicle=useCallback(async()=>{const id=++epoch.current;try{const value=await awaitWithTimeout(loadChronicle());if(id===epoch.current){setEntries(value);setError('');}}catch{if(id===epoch.current)setError('Nie udało się odczytać kroniki. Spróbuj ponownie.');}},[]);
 useFocusEffect(useCallback(()=>{void refreshChronicle();return()=>{epoch.current++;};},[story,refreshChronicle]));
 const open=(questId:string)=>router.push({pathname:'/quest',params:{questId}});
 const boss=story?.boss;
 const bossPhase=boss?bossPhaseState(story?.bossHp??100,100,Date.now(),boss.started_at):null;
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
   {story?.worldLinkComplete&&!boss&&<Action label="ROZPOCZNIJ PROTOKÓŁ BOSSA" disabled={busy} onPress={()=>{if(lock.current)return;lock.current=true;setBusy(true);setError('');const request=epoch.current;void awaitWithTimeout(startBossProtocol()).then(()=>refreshPlayer()).catch(()=>{if(mounted.current&&request===epoch.current)setError('Nie udało się rozpocząć Bossa. Sprawdź datę i ponów próbę.');}).finally(()=>{lock.current=false;if(mounted.current)setBusy(false);});}}/>}
   {boss&&<>
    <Text style={s.label}>BOSS ENGINE 3.0 // {bossPhase?.label}</Text>
    <Text style={s.body}>HP {story?.bossHp ?? 100}/100 · wsparcie zweryfikowanych misji: {story?.bossSupportDamage ?? 0}</Text>
    <Text style={s.body}>WEAK POINT: {bossPhase?.weakPoint} · DAMAGE MODIFIER ×{bossPhase?.damageMultiplier.toFixed(2)}{bossPhase?.enrage?' · ENRAGE ACTIVE':''}</Text>
    {bossPhase?.finisherReady&&<Text style={[s.label,{color:'#ffd36c'}]}>FINAL STRIKE READY // DOKOŃCZ PROTOKÓŁ</Text>}
    <Text style={s.body}>ETAP 1 // {boss.focus_at?'UKOŃCZONE':'DOSTĘPNY'} · 15 MIN SKUPIENIA</Text>
    {!boss.focus_at&&<Action label="ROZPOCZNIJ SKUPIENIE" onPress={()=>open(BOSS_FOCUS)}/>}
    <Text style={s.body}>ETAP 2 // {boss.move_at?'UKOŃCZONE':boss.focus_at?'DOSTĘPNY':'ZABLOKOWANE'} · 2 KM RUCHU</Text>
    {!!boss.focus_at&&!boss.move_at&&<><Action label="PRZEJDŹ 2 KM" onPress={()=>open(BOSS_WALK)}/><Action label="PRZEBIEGNIJ 2 KM" onPress={()=>open(BOSS_RUN)}/></>}
    <Text style={s.body}>ETAP 3 // {boss.discipline_at?'UKOŃCZONE':boss.move_at?'DOSTĘPNY':'ZABLOKOWANE'}</Text>
    <Text style={s.body}>Ukończ misję dzienną po etapie 2, najwcześniej następnego dnia od rozpoczęcia Bossa ({boss.start_day}). Późniejszy dzień również się liczy.</Text>
    {!!boss.move_at&&!boss.discipline_at&&<Action label="MISJE DZIENNE →" onPress={()=>router.push('/quests')}/>}
   </>}
   <Text style={s.label}>+{STORY_REWARDS.boss.realXp} REAL XP · +{STORY_REWARDS.boss.skillXp.WIL} WIL XP · +{STORY_REWARDS.boss.skillXp.VIT} VIT XP · +{STORY_REWARDS.boss.gameEnergy} ENERGII · POGROMCA MURU</Text>
  </View>
  <View style={s.panel}><Text style={s.label}>ROZDZIAŁ 03 // NIEZNANY // ZABLOKOWANY</Text></View>
  {!!error&&<View style={s.panel}><Text style={s.body}>{error}</Text><Action label="ODŚWIEŻ KRONIKĘ →" disabled={busy} onPress={()=>{void refreshChronicle();}}/></View>}
  <Text style={s.title}>CHRONICLE</Text>
    {entries.length === 0 ? <View style={s.panel}><Text style={s.body}>Chronicle zacznie się od pierwszego wydarzenia fabularnego.</Text></View> : entries.map(event=><View key={event.id} style={s.panel}><Text style={s.label}>{storyEventTypePl(event.type)}</Text><Text style={s.title}>{event.title}</Text>{!!event.subtitle&&<Text style={s.body}>{event.subtitle}</Text>}<Text style={s.body}>{new Date(event.created_at).toLocaleString()}</Text></View>)}
 </SystemPage>;
}
