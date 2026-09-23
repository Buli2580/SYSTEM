import {useMemo,useState} from 'react';
import {Pressable,StyleSheet,Text,View} from 'react-native';
import {useLocalSearchParams,useRouter} from 'expo-router';
import {MOVE_QUESTS} from '../move/catalog';
import {useSystem} from '../state/SystemProvider';
import {moveAgeMode} from '../move/age';
import {isSafeMoveQuest} from '../move/safety';
import {completeMoveActivity} from '../storage/database';
import {dayKey} from '../daily/calendar';
import {SYSTEM_COLORS as C} from '../core';
import {useMoveVerification} from '../move/useMoveVerification';
import {moveMinimumDistance} from '../move/verification';

export default function MoveQuestScreen(){
 const {questId}=useLocalSearchParams<{questId?:string}>(),router=useRouter(),{player}=useSystem();
 const quest=useMemo(()=>MOVE_QUESTS.find(q=>q.id===questId),[questId]),age=moveAgeMode(player.birthDate);
 const [busy,setBusy]=useState(false),[parentApproved,setParentApproved]=useState(false);
 if(!quest)return <Fallback title="MOVE QUEST NOT FOUND" onBack={()=>router.replace('/move')}/>;
 return <QuestBody quest={quest} age={age} busy={busy} setBusy={setBusy} parentApproved={parentApproved} setParentApproved={setParentApproved} onDone={()=>router.replace('/move')} onBack={()=>router.replace('/move')}/>;
}

function QuestBody({quest,age,busy,setBusy,parentApproved,setParentApproved,onDone,onBack}:{
 quest:(typeof MOVE_QUESTS)[number];age:ReturnType<typeof moveAgeMode>;busy:boolean;setBusy:(v:boolean)=>void;
 parentApproved:boolean;setParentApproved:(v:boolean)=>void;onDone:()=>void;onBack:()=>void;
}){
 const run=useMoveVerification(quest);
 const safe=isSafeMoveQuest(quest,age);
 const required=Math.max(60,quest.minutes*60);
 const readyByTime=run.elapsed>=required;
 const distanceTarget=quest.verification==='GPS_DISTANCE'||quest.verification==='MIXED'?moveMinimumDistance(quest):0;
 const needsParent=quest.verification==='PARENT_APPROVAL';
 const canFinish=readyByTime&&(!needsParent||parentApproved)&&run.status==='TRACKING';

 async function finish(){
  if(!canFinish||busy)return;
  setBusy(true);
  try{
    const evidence=await run.buildEvidence(parentApproved);
    await completeMoveActivity({...evidence,dayKey:dayKey()});
    onDone();
  }catch(e){
    // buildEvidence/DB validation keeps the canonical reason in the runner/state layer.
  }finally{setBusy(false)}
 }

 return <View style={styles.root}>
  <Text style={styles.code}>SYSTEM MOVE // {quest.kind}</Text>
  <Text style={styles.title}>{quest.title}</Text>
  <Text style={styles.body}>{quest.description}</Text>

  <View style={styles.timer}>
   <Text style={styles.timerLabel}>{quest.verification==='GPS_DISTANCE'||quest.verification==='MIXED'?'ACTIVE MOVE':'ACTIVE TIME'}</Text>
   <Text style={styles.timerValue}>{Math.floor(run.elapsed/60)}:{String(run.elapsed%60).padStart(2,'0')}</Text>
   <Text style={styles.body}>WYMAGANE MINIMUM {quest.minutes} MIN</Text>
   {distanceTarget>0&&<Text style={styles.metric}>DISTANCE {run.distance} / {distanceTarget} M</Text>}
   {run.activity&&<Text style={styles.metric}>DETECTED {run.activity.activityTypeDetected} · SCORE {run.activity.verificationScore}</Text>}
  </View>

  {!safe&&<Text style={styles.warning}>Ta misja nie jest dostępna dla tego trybu wieku.</Text>}
  {run.error&&<Text style={styles.warning}>{run.error}</Text>}
  {run.status==='UNAVAILABLE'&&<Text style={styles.warning}>Ta metoda wymaga prawdziwego providera kroków/Health. SYSTEM nie wygeneruje sztucznych danych.</Text>}

  {safe&&!run.running&&run.status!=='VERIFYING'&&<Pressable style={styles.button} onPress={()=>void run.start()}><Text style={styles.buttonText}>START MOVE QUEST</Text></Pressable>}

  {needsParent&&run.running&&readyByTime&&<Pressable onPress={()=>setParentApproved(!parentApproved)} style={[styles.approval,parentApproved&&styles.approvalOn]}>
   <Text style={styles.approvalText}>{parentApproved?'✓ OPIEKUN POTWIERDZA WYKONANIE':'OPIEKUN: POTWIERDŹ WYKONANIE'}</Text>
  </Pressable>}

  {run.running&&<Pressable disabled={!canFinish||busy} style={[styles.button,(!canFinish||busy)&&styles.disabled]} onPress={()=>void finish()}>
   <Text style={styles.buttonText}>{canFinish?'VERIFY & COMPLETE':'QUEST ACTIVE'}</Text>
  </Pressable>}

  <Text style={styles.notice}>GPS działa tylko podczas otwartego ekranu tej misji MOVE. Dokładna trasa nie trafia do publicznego profilu.</Text>
  <Pressable onPress={onBack}><Text style={styles.back}>← SYSTEM MOVE</Text></Pressable>
 </View>;
}

function Fallback({title,onBack}:{title:string;onBack:()=>void}){return <View style={styles.root}><Text style={styles.title}>{title}</Text><Pressable onPress={onBack}><Text style={styles.back}>← SYSTEM MOVE</Text></Pressable></View>}
const styles=StyleSheet.create({
 root:{flex:1,justifyContent:'center',padding:24,backgroundColor:C.background},
 code:{color:C.cyan,fontSize:9,fontWeight:'900',letterSpacing:1.4},
 title:{color:C.white,fontSize:30,lineHeight:36,fontWeight:'900',marginTop:10},
 body:{color:C.textMuted,fontSize:13,lineHeight:20,marginTop:10},
 timer:{marginTop:28,padding:22,borderWidth:1,borderColor:C.lineBright,borderRadius:20,alignItems:'center'},
 timerLabel:{color:C.cyan,fontSize:9,fontWeight:'900'},timerValue:{color:C.white,fontSize:52,fontWeight:'900',marginTop:8},
 metric:{color:C.cyan,fontSize:10,fontWeight:'900',marginTop:8},
 warning:{color:C.warning,fontSize:12,lineHeight:18,fontWeight:'800',marginTop:20},
 button:{marginTop:24,minHeight:54,borderRadius:15,alignItems:'center',justifyContent:'center',backgroundColor:C.cyan},
 disabled:{opacity:.35},buttonText:{color:'#001014',fontWeight:'900'},
 approval:{marginTop:18,padding:14,borderWidth:1,borderColor:C.line,borderRadius:14},
 approvalOn:{borderColor:C.cyan,backgroundColor:'rgba(108,238,255,.08)'},
 approvalText:{color:C.white,fontSize:10,lineHeight:15,fontWeight:'900',textAlign:'center'},
 notice:{color:C.textVeryMuted,fontSize:9,lineHeight:14,marginTop:18},back:{color:C.cyan,fontWeight:'900',marginTop:22}
});
