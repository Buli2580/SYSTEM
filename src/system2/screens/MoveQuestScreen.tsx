import {useEffect,useMemo,useRef,useState} from 'react';
import {Pressable,StyleSheet,Text,View} from 'react-native';
import {useLocalSearchParams,useRouter} from 'expo-router';
import {MOVE_QUESTS} from '../move/catalog';
import {useSystem} from '../state/SystemProvider';
import {moveAgeMode} from '../move/age';
import {isSafeMoveQuest} from '../move/safety';
import {completeMoveActivity} from '../storage/database';
import {dayKey} from '../daily/calendar';
import {SYSTEM_COLORS as C} from '../core';

export default function MoveQuestScreen(){
 const {questId}=useLocalSearchParams<{questId?:string}>(),router=useRouter(),{player}=useSystem();
 const quest=useMemo(()=>MOVE_QUESTS.find(q=>q.id===questId),[questId]),age=moveAgeMode(player.birthDate);
 const [running,setRunning]=useState(false),[elapsed,setElapsed]=useState(0),[busy,setBusy]=useState(false),timer=useRef<ReturnType<typeof setInterval>|null>(null);
 const safe=!!quest&&isSafeMoveQuest(quest,age),supported=quest?.verification==='TIMER';
 useEffect(()=>()=>{if(timer.current)clearInterval(timer.current)},[]);
 function start(){if(!quest||!safe||!supported)return;setElapsed(0);setRunning(true);timer.current=setInterval(()=>setElapsed(x=>x+1),1000)}
 async function finish(){
  if(!quest||busy)return;setBusy(true);
  try{await completeMoveActivity({questId:quest.id,dayKey:dayKey(),durationSeconds:elapsed});router.replace('/move')}
  finally{setBusy(false)}
 }
 if(!quest)return <Fallback title="MOVE QUEST NOT FOUND" onBack={()=>router.replace('/move')}/>;
 const required=Math.max(60,quest.minutes*60),ready=elapsed>=required;
 return <View style={styles.root}>
  <Text style={styles.code}>SYSTEM MOVE // {quest.kind}</Text><Text style={styles.title}>{quest.title}</Text><Text style={styles.body}>{quest.description}</Text>
  <View style={styles.timer}><Text style={styles.timerLabel}>ACTIVE TIME</Text><Text style={styles.timerValue}>{Math.floor(elapsed/60)}:{String(elapsed%60).padStart(2,'0')}</Text><Text style={styles.body}>WYMAGANE MINIMUM {Math.ceil(required/60)} MIN</Text></View>
  {!safe&&<Text style={styles.warning}>Ta misja nie jest dostępna dla tego trybu wieku.</Text>}
  {safe&&!supported&&<Text style={styles.warning}>Ta misja wymaga {quest.verification}. Ta warstwa weryfikacji nie jest jeszcze aktywna w MOVE runnerze.</Text>}
  {safe&&supported&&!running&&<Pressable style={styles.button} onPress={start}><Text style={styles.buttonText}>START MOVE QUEST</Text></Pressable>}
  {running&&<Pressable disabled={!ready||busy} style={[styles.button,(!ready||busy)&&styles.disabled]} onPress={()=>void finish()}><Text style={styles.buttonText}>{ready?'VERIFY & COMPLETE':'QUEST ACTIVE'}</Text></Pressable>}
  <Pressable onPress={()=>router.replace('/move')}><Text style={styles.back}>← SYSTEM MOVE</Text></Pressable>
 </View>;
}
function Fallback({title,onBack}:{title:string;onBack:()=>void}){return <View style={styles.root}><Text style={styles.title}>{title}</Text><Pressable onPress={onBack}><Text style={styles.back}>← SYSTEM MOVE</Text></Pressable></View>}
const styles=StyleSheet.create({root:{flex:1,justifyContent:'center',padding:24,backgroundColor:C.background},code:{color:C.cyan,fontSize:9,fontWeight:'900',letterSpacing:1.4},title:{color:C.white,fontSize:30,lineHeight:36,fontWeight:'900',marginTop:10},body:{color:C.textMuted,fontSize:13,lineHeight:20,marginTop:10},timer:{marginTop:28,padding:22,borderWidth:1,borderColor:C.lineBright,borderRadius:20,alignItems:'center'},timerLabel:{color:C.cyan,fontSize:9,fontWeight:'900'},timerValue:{color:C.white,fontSize:52,fontWeight:'900',marginTop:8},warning:{color:C.warning,fontSize:12,lineHeight:18,fontWeight:'800',marginTop:20},button:{marginTop:24,minHeight:54,borderRadius:15,alignItems:'center',justifyContent:'center',backgroundColor:C.cyan},disabled:{opacity:.35},buttonText:{color:'#001014',fontWeight:'900'},back:{color:C.cyan,fontWeight:'900',marginTop:22}});
