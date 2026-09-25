import {useCallback,useState} from 'react';
import {ScrollView,StyleSheet,Text,View} from 'react-native';
import {useFocusEffect} from 'expo-router';
import SystemScreen from '../components/SystemScreen';
import {SYSTEM_COLORS as C} from '../core';
import {loadMoveState} from '../storage/database';
import {parentMoveSummary} from '../move/parent';
import type {MoveState} from '../move/state';

export default function MoveParentScreen(){
 const[state,setState]=useState<MoveState|null>(null);
 useFocusEffect(useCallback(()=>{void loadMoveState().then(setState).catch(()=>setState(null))},[]));
 const summary=state?parentMoveSummary(state):null;
 return <SystemScreen style={styles.root}><ScrollView contentContainerStyle={styles.content}>
  <Text style={styles.code}>SYSTEM MOVE // PARENT DASHBOARD</Text>
  <Text style={styles.title}>POSTĘP RUCHOWY</Text>
  <Text style={styles.body}>Dashboard pokazuje aktywność i rozwój umiejętności. Nie zawiera dokładnej lokalizacji dziecka.</Text>
  <View style={styles.grid}>
   <Card label="DZISIAJ" value={summary?`${summary.activeMinutesToday} MIN`:'--'}/>
   <Card label="MOVE STREAK" value={summary?`${summary.streak} DNI`:'--'}/>
   <Card label="ŚREDNIA 7D" value={summary?`${summary.sevenDayAverage} MIN`:'--'}/>
   <Card label="QUESTY" value={summary?String(summary.completedToday):'--'}/>
  </View>
  <View style={styles.panel}><Text style={styles.label}>MOVEMENT SKILLS</Text>{summary&&Object.entries(summary.skillLevels).map(([k,v])=><View key={k} style={styles.row}><Text style={styles.body}>{k}</Text><Text style={styles.value}>LV.{v}</Text></View>)}</View>
  <View style={styles.safe}><Text style={styles.label}>PRIVACY</Text><Text style={styles.body}>PRECISE LOCATION INCLUDED: NO</Text></View>
 </ScrollView></SystemScreen>;
}
function Card({label,value}:{label:string;value:string}){return <View style={styles.card}><Text style={styles.label}>{label}</Text><Text style={styles.cardValue}>{value}</Text></View>}
const styles=StyleSheet.create({root:{flex:1,backgroundColor:C.background},content:{padding:22,paddingBottom:80},code:{color:C.cyan,fontSize:9,fontWeight:'900',letterSpacing:1.2},title:{color:C.white,fontSize:28,fontWeight:'900',marginTop:8},body:{color:C.textMuted,fontSize:11,lineHeight:17,marginTop:6},grid:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:18},card:{width:'48%',padding:14,borderWidth:1,borderColor:C.line,borderRadius:15,backgroundColor:C.panel},label:{color:C.cyan,fontSize:9,fontWeight:'900'},cardValue:{color:C.white,fontSize:20,fontWeight:'900',marginTop:6},panel:{marginTop:14,padding:16,borderWidth:1,borderColor:C.line,borderRadius:16},row:{flexDirection:'row',justifyContent:'space-between',paddingVertical:6},value:{color:C.white,fontWeight:'900'},safe:{marginTop:14,padding:16,borderWidth:1,borderColor:C.cyanDark,borderRadius:16}});
