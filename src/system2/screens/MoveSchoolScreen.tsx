import {useCallback,useMemo,useState} from 'react';
import {ScrollView,StyleSheet,Text,View,Pressable} from 'react-native';
import {useFocusEffect,useRouter} from 'expo-router';
import SystemScreen from '../components/SystemScreen';
import SystemAmbientBackground from '../components/SystemAmbientBackground';
import {SYSTEM_COLORS as C} from '../core';
import {loadMoveState} from '../storage/database';
import type {MoveState} from '../move/state';
import {schoolContributionScore,schoolRaidDamage,SCHOOL_RANKING_RULE} from '../move/school';

export default function MoveSchoolScreen(){
 const router=useRouter(),[state,setState]=useState<MoveState|null>(null);
 useFocusEffect(useCallback(()=>{void loadMoveState().then(setState).catch(()=>setState(null))},[]));
 const last7=useMemo(()=>state?[...state.history,{dayKey:state.dayKey,minutes:state.activeMinutes,questIds:state.completedQuestIds}].slice(-7):[],[state]);
 const minutes=last7.reduce((n,d)=>n+d.minutes,0),activeDays=last7.filter(d=>d.minutes>0).length;
 const contribution=schoolContributionScore(minutes,activeDays);
 const localDamage=schoolRaidDamage(last7.map((d,i)=>({participantId:'local-'+i,verifiedMinutes:d.minutes,dayKey:d.dayKey})));
 return <SystemScreen style={styles.root}>
  <SystemAmbientBackground intensity="world" screen="WORLD" scene="CITY" threat={2}/>
  <ScrollView contentContainerStyle={styles.content}>
   <Text style={styles.code}>SYSTEM MOVE // SCHOOL MODE</Text>
   <Text style={styles.title}>KAŻDY RUCH LICZY SIĘ DLA DRUŻYNY.</Text>
   <Text style={styles.body}>School Mode nagradza regularność i wkład. Nie tworzymy rankingów wagi, wyglądu ani sprawności fizycznej dzieci.</Text>

   <View style={styles.grid}>
    <Card label="7D MOVE" value={minutes+' MIN'}/>
    <Card label="ACTIVE DAYS" value={String(activeDays)}/>
    <Card label="CONTRIBUTION" value={String(contribution)}/>
    <Card label="RAID DAMAGE" value={String(localDamage)}/>
   </View>

   <View style={styles.panel}><Text style={styles.label}>SCHOOL CONNECTION</Text><Text style={styles.big}>NOT LINKED</Text><Text style={styles.body}>Na tym etapie ekran pokazuje wyłącznie lokalny wkład gracza. Dane klasy, szkoły, członków i globalnego HP pojawią się dopiero po podłączeniu backendu szkolnego.</Text></View>

   <View style={styles.panel}><Text style={styles.label}>SCHOOL RAID RULE</Text><Text style={styles.body}>{SCHOOL_RANKING_RULE.replaceAll('_',' ')}</Text><Text style={styles.body}>Zweryfikowane minuty → wkład do raidu. Regularność zwiększa contribution score. Dane lokalizacyjne nie są częścią publicznego wyniku.</Text></View>

   <View style={styles.safe}><Text style={styles.label}>CHILD SAFETY</Text><Text style={styles.body}>PUBLIC PRECISE LOCATION: OFF · BODY METRICS: OFF · APPEARANCE RANKING: OFF · DIRECT MINOR MESSAGES: OFF</Text></View>
   <Pressable onPress={()=>router.replace('/move')}><Text style={styles.back}>← SYSTEM MOVE</Text></Pressable>
  </ScrollView>
 </SystemScreen>;
}
function Card({label,value}:{label:string;value:string}){return <View style={styles.card}><Text style={styles.label}>{label}</Text><Text style={styles.cardValue}>{value}</Text></View>}
const styles=StyleSheet.create({
 root:{flex:1,backgroundColor:C.background},content:{padding:22,paddingBottom:90},code:{color:C.cyan,fontSize:9,fontWeight:'900',letterSpacing:1.3},
 title:{color:C.white,fontSize:29,lineHeight:35,fontWeight:'900',marginTop:8},body:{color:C.textMuted,fontSize:11,lineHeight:17,marginTop:7},
 grid:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:18},card:{width:'48%',padding:14,borderWidth:1,borderColor:C.line,borderRadius:15,backgroundColor:C.panel},label:{color:C.cyan,fontSize:9,fontWeight:'900'},cardValue:{color:C.white,fontSize:20,fontWeight:'900',marginTop:6},
 panel:{marginTop:14,padding:16,borderWidth:1,borderColor:C.line,borderRadius:17,backgroundColor:'rgba(4,16,20,.9)'},big:{color:C.white,fontSize:22,fontWeight:'900',marginTop:7},
 safe:{marginTop:14,padding:16,borderWidth:1,borderColor:C.cyanDark,borderRadius:16},back:{color:C.cyan,fontWeight:'900',marginTop:22}
});
