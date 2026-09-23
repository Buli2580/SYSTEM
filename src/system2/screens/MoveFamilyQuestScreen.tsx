import {useEffect,useMemo,useRef,useState} from 'react';
import {Pressable,StyleSheet,Text,View} from 'react-native';
import {useLocalSearchParams,useRouter} from 'expo-router';
import {WEEKEND_FAMILY_QUESTS} from '../move/family';
import {MOVE_QUESTS} from '../move/catalog';
import {completeMoveActivity} from '../storage/database';
import {dayKey} from '../daily/calendar';
import {SYSTEM_COLORS as C} from '../core';

export default function MoveFamilyQuestScreen(){
 const {questId}=useLocalSearchParams<{questId?:string}>(),router=useRouter();
 const family=useMemo(()=>WEEKEND_FAMILY_QUESTS.find(q=>q.id===questId),[questId]);
 const canonical=useMemo(()=>family?MOVE_QUESTS.find(q=>q.id===family.id):undefined,[family]);
 const[running,setRunning]=useState(false),[elapsed,setElapsed]=useState(0),[approved,setApproved]=useState(false),[busy,setBusy]=useState(false);
 const timer=useRef<ReturnType<typeof setInterval>|null>(null);
 useEffect(()=>()=>{if(timer.current)clearInterval(timer.current)},[]);
 if(!family||!canonical)return <View style={styles.root}><Text style={styles.title}>FAMILY QUEST NOT FOUND</Text><Pressable onPress={()=>router.replace('/move-family')}><Text style={styles.back}>← FAMILY MODE</Text></Pressable></View>;
 const required=family.minutes*60,ready=elapsed>=required;
 function start(){setElapsed(0);setApproved(false);setRunning(true);timer.current=setInterval(()=>setElapsed(v=>v+1),1000)}
 async function finish(){
  if(!ready||!approved||busy)return;
  setBusy(true);
  try{
   await completeMoveActivity({questId:canonical.id,dayKey:dayKey(),durationSeconds:elapsed,parentApproved:true});
   router.replace('/move-family');
  }finally{setBusy(false)}
 }
 return <View style={styles.root}>
  <Text style={styles.code}>SYSTEM MOVE // FAMILY QUEST</Text>
  <Text style={styles.title}>{family.title}</Text>
  <Text style={styles.body}>{family.minutes} minut wspólnej aktywności · minimum {family.memberGoal} osoby.</Text>
  <View style={styles.timer}><Text style={styles.label}>FAMILY ACTIVE TIME</Text><Text style={styles.time}>{Math.floor(elapsed/60)}:{String(elapsed%60).padStart(2,'0')}</Text></View>
  {!running&&<Pressable style={styles.button} onPress={start}><Text style={styles.buttonText}>START FAMILY QUEST</Text></Pressable>}
  {running&&ready&&<>
   <Pressable onPress={()=>setApproved(v=>!v)} style={[styles.approval,approved&&styles.approvalOn]}><Text style={styles.approvalText}>{approved?'✓ OPIEKUN POTWIERDZA WSPÓLNĄ AKTYWNOŚĆ':'OPIEKUN: POTWIERDŹ WSPÓLNĄ AKTYWNOŚĆ'}</Text></Pressable>
   <Pressable disabled={!approved||busy} style={[styles.button,(!approved||busy)&&styles.disabled]} onPress={()=>void finish()}><Text style={styles.buttonText}>VERIFY FAMILY QUEST</Text></Pressable>
  </>}
  {running&&!ready&&<Text style={styles.wait}>QUEST ACTIVE // POZOSTAŁO {Math.ceil((required-elapsed)/60)} MIN</Text>}
  <Text style={styles.notice}>Potwierdzenie opiekuna jest lokalnym mechanizmem MVP. Nie zastępuje konta rodzica ani zdalnej autoryzacji.</Text>
  <Pressable onPress={()=>router.replace('/move-family')}><Text style={styles.back}>← FAMILY MODE</Text></Pressable>
 </View>;
}
const styles=StyleSheet.create({
 root:{flex:1,justifyContent:'center',padding:24,backgroundColor:C.background},code:{color:C.cyan,fontSize:9,fontWeight:'900',letterSpacing:1.3},
 title:{color:C.white,fontSize:29,lineHeight:35,fontWeight:'900',marginTop:10},body:{color:C.textMuted,fontSize:12,lineHeight:19,marginTop:9},
 timer:{marginTop:24,padding:22,borderWidth:1,borderColor:C.lineBright,borderRadius:20,alignItems:'center'},label:{color:C.cyan,fontSize:9,fontWeight:'900'},time:{color:C.white,fontSize:48,fontWeight:'900',marginTop:8},
 button:{marginTop:18,minHeight:54,borderRadius:15,alignItems:'center',justifyContent:'center',backgroundColor:C.cyan},disabled:{opacity:.35},buttonText:{color:'#001014',fontWeight:'900'},
 approval:{marginTop:18,padding:14,borderWidth:1,borderColor:C.line,borderRadius:14},approvalOn:{borderColor:C.cyan,backgroundColor:'rgba(108,238,255,.08)'},approvalText:{color:C.white,fontSize:10,lineHeight:15,fontWeight:'900',textAlign:'center'},
 wait:{color:C.warning,fontSize:10,fontWeight:'900',marginTop:18,textAlign:'center'},notice:{color:C.textVeryMuted,fontSize:9,lineHeight:14,marginTop:18},back:{color:C.cyan,fontWeight:'900',marginTop:20}
});
