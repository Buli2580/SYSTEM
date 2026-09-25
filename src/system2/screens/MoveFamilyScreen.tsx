import {useCallback,useMemo,useState} from 'react';
import {Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {useFocusEffect,useRouter} from 'expo-router';
import SystemScreen from '../components/SystemScreen';
import SystemAmbientBackground from '../components/SystemAmbientBackground';
import {SYSTEM_COLORS as C} from '../core';
import {useSystem} from '../state/SystemProvider';
import {loadMoveState} from '../storage/database';
import type {MoveState} from '../move/state';
import {familyBossDamage} from '../move/family';
import {MOVE_QUESTS} from '../move/catalog';
import {moveAgeMode,moveAgeLabel} from '../move/age';
import {moveSafetyPolicy} from '../move/safety';
import MoveCloudGroupPanel from '../components/MoveCloudGroupPanel';
import {FAMILY_MISSIONS_2} from '../move/family2';

export default function MoveFamilyScreen(){
 const router=useRouter(),{player}=useSystem();
 const[state,setState]=useState<MoveState|null>(null);
 const ageMode=moveAgeMode(player.birthDate),policy=moveSafetyPolicy(ageMode);
 useFocusEffect(useCallback(()=>{void loadMoveState().then(setState).catch(()=>setState(null))},[]));
 const familyMinutes=useMemo(()=>{
  if(!state)return 0;
  const familyIds=new Set(MOVE_QUESTS.filter(q=>q.familyEligible).map(q=>q.id));
  return state.history.concat([{dayKey:state.dayKey,minutes:state.activeMinutes,questIds:state.completedQuestIds}])
   .slice(-7).reduce((sum,day)=>sum+day.questIds.filter(id=>familyIds.has(id)).reduce((n,id)=>n+(MOVE_QUESTS.find(q=>q.id===id)?.minutes??0),0),0);
 },[state]);
 const previewDamage=familyBossDamage(familyMinutes,2);
 return <SystemScreen style={styles.root}>
  <SystemAmbientBackground intensity="world" screen="WORLD" scene="FOREST" threat={1} level={player.realLevel}/>
  <ScrollView contentContainerStyle={styles.content}>
   <Text style={styles.code}>SYSTEM MOVE // FAMILY MODE</Text>
   <Text style={styles.title}>RAZEM ZADAJECIE WIĘCEJ.</Text>
   <Text style={styles.body}>Wspólne aktywności budują rodzinny wkład do bossa. Nie pokazujemy publicznie dokładnej lokalizacji ani danych ciała.</Text>

   <View style={styles.panel}>
    <Text style={styles.label}>FAMILY STATUS</Text>
    <Text style={styles.big}>{familyMinutes} MIN</Text>
    <Text style={styles.body}>LOCAL FAMILY MINUTES // OSTATNIE 7 DNI</Text>
    <Text style={styles.reward}>LOCAL BOSS DAMAGE PREVIEW // {previewDamage}</Text>
    <Text style={styles.body}>Tryb wieku gracza: {moveAgeLabel(ageMode)} · Parent approval: {policy.parentApprovalRequired?'REQUIRED':'OPTIONAL'}</Text>
   </View>

   <Text style={styles.section}>FAMILY 2.0 // CO-OP MISSIONS</Text>
   {FAMILY_MISSIONS_2.map(m=><Pressable key={m.id} onPress={()=>router.push({pathname:'/move-quest',params:{questId:m.questId}})} style={styles.quest}><Text style={styles.label}>{m.mode} // {m.verification}</Text><Text style={styles.questTitle}>{m.title}</Text><Text style={styles.body}>{m.minutes} MIN · {m.participants} PARTICIPANTS · wynik rodzinny bez publicznej lokalizacji.</Text><Text style={styles.reward}>START CANONICAL MOVE QUEST →</Text></Pressable>)}
   <MoveCloudGroupPanel kind="FAMILY"/>
   <View style={styles.safe}><Text style={styles.label}>FAMILY SAFETY</Text><Text style={styles.body}>PRECISE LOCATION PUBLIC: OFF · BODY RANKING: OFF · MINOR DM: OFF · FAMILY RESULT: CONTRIBUTION ONLY</Text></View>
   <Pressable onPress={()=>router.replace('/move')}><Text style={styles.back}>← SYSTEM MOVE</Text></Pressable>
  </ScrollView>
 </SystemScreen>;
}
const styles=StyleSheet.create({
 root:{flex:1,backgroundColor:C.background},content:{padding:22,paddingBottom:90},
 code:{color:C.cyan,fontSize:9,fontWeight:'900',letterSpacing:1.3},title:{color:C.white,fontSize:29,lineHeight:35,fontWeight:'900',marginTop:8},
 body:{color:C.textMuted,fontSize:11,lineHeight:17,marginTop:7},panel:{marginTop:16,padding:16,borderWidth:1,borderColor:C.line,borderRadius:18,backgroundColor:'rgba(4,16,20,.92)'},
 label:{color:C.cyan,fontSize:9,lineHeight:14,fontWeight:'900',letterSpacing:1},big:{color:C.white,fontSize:34,fontWeight:'900',marginTop:8},reward:{color:'#ffd36c',fontSize:10,fontWeight:'900',marginTop:10},
 section:{color:C.white,fontSize:16,fontWeight:'900',marginTop:24},quest:{marginTop:10,padding:16,borderWidth:1,borderColor:'rgba(228,186,255,.45)',borderRadius:17,backgroundColor:'rgba(35,13,45,.45)'},
 questTitle:{color:C.white,fontSize:18,lineHeight:23,fontWeight:'900',marginTop:6},safe:{marginTop:18,padding:16,borderWidth:1,borderColor:C.cyanDark,borderRadius:16},back:{color:C.cyan,fontWeight:'900',marginTop:22}
});
