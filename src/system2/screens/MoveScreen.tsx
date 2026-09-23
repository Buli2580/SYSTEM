import {useCallback,useMemo,useState} from 'react';
import {Pressable,ScrollView,StyleSheet,Text,View,type DimensionValue} from 'react-native';
import {useFocusEffect,useRouter} from 'expo-router';
import SystemScreen from '../components/SystemScreen';
import BottomNavigation from '../components/BottomNavigation';
import SystemAmbientBackground from '../components/SystemAmbientBackground';
import {SYSTEM_COLORS as C} from '../core';
import {useSystem} from '../state/SystemProvider';
import {dayKey} from '../daily/calendar';
import {moveAgeMode,moveAgeLabel} from '../move/age';
import {buildMoveDayPlan,moveDirectorLine} from '../move/director';
import {activeMoveEvent} from '../move/events';
import {loadMoveState} from '../storage/database';
import {moveProgress,moveRecentAverage,type MoveState} from '../move/state';
import {MOVEMENT_SKILLS} from '../move/skills';
import {nextMoveStreakMilestone,moveStreakReward} from '../move/streak';
import {moveSafetyPolicy} from '../move/safety';
import {WEEKEND_FAMILY_QUESTS} from '../move/family';
import {MOVE_CHALLENGE_TEMPLATES} from '../move/challenges';
import {buildMovementProgressCard} from '../move/card';

export default function MoveScreen(){
 const router=useRouter(),{player}=useSystem();
 const ageMode=moveAgeMode(player.birthDate),today=dayKey();
 const moveLocked=ageMode==='UNDER_6'||ageMode==='UNKNOWN';
 const[state,setState]=useState<MoveState|null>(null);
 const refresh=useCallback(()=>{void loadMoveState().then(setState).catch(()=>setState(null))},[]);
 useFocusEffect(refresh);
 const failedYesterday=Boolean(state?.history.at(-1)&&state.history.at(-1)!.minutes<60);
 const plan=useMemo(()=>buildMoveDayPlan(today,ageMode,failedYesterday),[today,ageMode,failedYesterday]);
 const event=activeMoveEvent(player.id);
 const completed=state?.completedQuestIds??[];
 const progress=state?Math.round(moveProgress(state)*100):0;
 const nextMilestone=nextMoveStreakMilestone(state?.streak??0),reward=moveStreakReward(state?.streak??0),policy=moveSafetyPolicy(ageMode);
 const progressCard=state?buildMovementProgressCard(player.displayName,state):null;
 return <SystemScreen style={styles.root}>
  <SystemAmbientBackground intensity="world" screen="WORLD" scene="FOREST" threat={1} level={player.realLevel}/>
  <ScrollView contentContainerStyle={styles.content}>
   <Text style={styles.code}>SYSTEM MOVE 1.0 // {moveAgeLabel(ageMode)}</Text>
   <Text style={styles.hero}>RUCH STAJE SIĘ GRĄ.</Text>
   <Text style={styles.body}>Codzienny cel jest dzielony na krótkie misje. Liczy się regularność, ruch i wkład — nie waga ani wygląd.</Text>
   {moveLocked&&<View style={styles.safety}><Text style={styles.label}>MOVE LOCKED // {moveAgeLabel(ageMode)}</Text><Text style={styles.body}>{ageMode==='UNKNOWN'?'Ustaw datę urodzenia w profilu, aby SYSTEM dobrał bezpieczny tryb wieku.':'SYSTEM MOVE 1.0 jest przeznaczony od 6 roku życia.'}</Text></View>}

   <View style={styles.panel}>
    <View style={styles.row}><Text style={styles.label}>60 MIN MISSION</Text><Text style={styles.value}>{state?.activeMinutes??0}/60 MIN</Text></View>
    <View style={styles.track}><View style={[styles.fill,{width:`${Math.max(2,progress)}%` as DimensionValue}]}/></View>
    <View style={styles.stats}><Stat label="MOVE STREAK" value={`${state?.streak??0} DAYS`}/><Stat label="7D AVG" value={`${state?moveRecentAverage(state):0} MIN`}/><Stat label="NEXT" value={nextMilestone?`${nextMilestone} DAYS`:'MAX'}/></View>
    {reward&&<Text style={styles.reward}>UNLOCK // {reward}</Text>}
   </View>

   <View style={styles.event}>
    <Text style={styles.eventCode}>WORLD EVENT MOVE // {event.kind.replaceAll('_',' ')}</Text>
    <Text style={styles.eventTitle}>{event.title}</Text>
    <Text style={styles.body}>{event.minutes} MIN · SKILL {event.skill} · EVENT WINDOW 3H</Text>
   </View>

   <Text style={styles.section}>MOVE DIRECTOR // LOCAL</Text>
   <View style={styles.panel}><Text style={styles.next}>{moveDirectorLine(plan,completed)}</Text><Text style={styles.body}>{plan.recovery?'EASY DAY // po słabszym dniu SYSTEM wybiera lżejszy plan.':`PLANOWANE ${plan.plannedMinutes} MIN // cel 60 MIN`}</Text></View>

   <Text style={styles.section}>DAILY MOVE QUESTS</Text>
   {plan.quests.map(q=>{const done=completed.includes(q.id),supported=q.verification==='TIMER';return <Pressable key={q.id} disabled={done||!supported} onPress={()=>router.push({pathname:'/move-quest',params:{questId:q.id}})} style={[styles.quest,done&&styles.done,!supported&&styles.locked]}>
    <View style={styles.row}><Text style={styles.questCode}>{q.kind} // {q.minutes} MIN</Text><Text style={styles.questStatus}>{done?'COMPLETE':supported?'START':'VERIFY NEXT'}</Text></View>
    <Text style={styles.questTitle}>{q.title}</Text><Text style={styles.body}>{q.description}</Text>
    <Text style={styles.questSkills}>{q.skills.join(' · ')} // {q.verification}</Text>
   </Pressable>})}

   <Text style={styles.section}>MOVEMENT HISTORY</Text>
   <View style={styles.panel}><Text style={styles.label}>LAST 7 DAYS</Text>{(state?.history??[]).slice(-6).concat(state?[{dayKey:state.dayKey,minutes:state.activeMinutes,questIds:state.completedQuestIds}]:[]).slice(-7).map(day=><View key={day.dayKey} style={styles.historyRow}><Text style={styles.historyDay}>{day.dayKey}</Text><Text style={styles.historyMinutes}>{day.minutes} MIN</Text></View>)}{!state?.history.length&&<Text style={styles.body}>Historia zacznie się budować po pierwszych dniach MOVE.</Text>}</View>

   <Text style={styles.section}>MOVEMENT SKILLS</Text>
   <View style={styles.skillGrid}>{MOVEMENT_SKILLS.map(key=>{const skill=state?.skills[key];return <View key={key} style={styles.skill}><Text style={styles.skillName}>{key}</Text><Text style={styles.skillLevel}>LV.{skill?.level??1}</Text><Text style={styles.skillXp}>{skill?.xp??0}/{skill?.xpToNext??0} XP</Text></View>})}</View>

   <Text style={styles.section}>MOVEMENT PROGRESS CARD</Text>
   <View style={styles.panel}><Text style={styles.label}>{progressCard?.title??'SYSTEM MOVE CARD'}</Text><Text style={styles.next}>{progressCard?.subtitle??'0/60 MIN'}</Text><Text style={styles.body}>{progressCard?`${progressCard.bestSkill} LV.${progressCard.bestSkillLevel} · ${progressCard.streak} DAY STREAK`:'Pierwsza karta powstanie po aktywności MOVE.'}</Text></View>

   <Text style={styles.section}>FAMILY WEEKEND</Text>
   {WEEKEND_FAMILY_QUESTS.map(q=><View key={q.id} style={styles.panel}><Text style={styles.label}>{q.title}</Text><Text style={styles.body}>{q.minutes} MIN · MIN. {q.memberGoal} OSOBY · SAFE LOCATION REQUIRED</Text></View>)}

   <Text style={styles.section}>NATIONAL / SPONSOR CHALLENGES</Text>
   {MOVE_CHALLENGE_TEMPLATES.map(c=><View key={c.id} style={styles.panel}><Text style={styles.label}>{c.audience}</Text><Text style={styles.questTitle}>{c.title}</Text><Text style={styles.body}>TARGET {c.targetMinutes.toLocaleString()} MIN · {c.rewardLabel}</Text></View>)}

   <Text style={styles.section}>FAMILY / SCHOOL</Text>
   <Pressable onPress={()=>router.push('/move-family')} style={styles.panel}><Text style={styles.label}>FAMILY MODE</Text><Text style={styles.body}>Wspólne weekend questy, rodzinny wkład i boss damage. →</Text></Pressable>
   <Pressable onPress={()=>router.push('/move-parent')} style={styles.panel}><Text style={styles.label}>PARENT DASHBOARD</Text><Text style={styles.body}>Czas ruchu, Move Streak, historia i Movement Skills. Bez dokładnej lokalizacji dziecka. →</Text></Pressable>
   <Pressable onPress={()=>router.push('/move-school')} style={styles.panel}><Text style={styles.label}>SCHOOL MODE</Text><Text style={styles.body}>Lokalny wkład ucznia, zasady School Raid i bezpieczne rankingi regularności. →</Text></Pressable>
   <View style={styles.safety}><Text style={styles.label}>SAFE MOVE POLICY</Text><Text style={styles.body}>PRECISE LOCATION PUBLIC: OFF · BODY RANKING: OFF · MINOR DM: OFF · PARENT APPROVAL: {policy.parentApprovalRequired?'ON':'OPTIONAL'}</Text></View>
  </ScrollView>
  <BottomNavigation/>
 </SystemScreen>;
}
function Stat({label,value}:{label:string;value:string}){return <View style={styles.stat}><Text style={styles.statLabel}>{label}</Text><Text style={styles.statValue}>{value}</Text></View>}
const styles=StyleSheet.create({
 root:{flex:1,backgroundColor:C.background},content:{padding:22,paddingBottom:150},
 code:{color:C.cyan,fontSize:9,fontWeight:'900',letterSpacing:1.4},hero:{color:C.white,fontSize:30,lineHeight:36,fontWeight:'900',marginTop:8},
 body:{color:C.textMuted,fontSize:11,lineHeight:17,marginTop:7},panel:{marginTop:12,padding:16,borderWidth:1,borderColor:C.line,borderRadius:18,backgroundColor:'rgba(4,16,20,.9)'},
 row:{flexDirection:'row',justifyContent:'space-between',gap:10,alignItems:'flex-start'},label:{color:C.cyan,fontSize:9,lineHeight:14,fontWeight:'900',letterSpacing:1},value:{color:C.white,fontSize:14,fontWeight:'900'},
 track:{height:8,borderRadius:8,overflow:'hidden',backgroundColor:'#16313a',marginTop:12},fill:{height:'100%',backgroundColor:C.cyan},
 stats:{flexDirection:'row',gap:7,marginTop:12},stat:{flex:1,minWidth:0},statLabel:{color:C.textVeryMuted,fontSize:7,fontWeight:'900'},statValue:{color:C.white,fontSize:11,fontWeight:'900',marginTop:4},
 reward:{color:'#ffd36c',fontSize:9,fontWeight:'900',marginTop:12},event:{marginTop:14,padding:16,borderWidth:1,borderColor:'rgba(228,186,255,.5)',borderRadius:18,backgroundColor:'rgba(35,13,45,.55)'},
 eventCode:{color:'#e4baff',fontSize:8,fontWeight:'900',letterSpacing:1.1},eventTitle:{color:C.white,fontSize:19,fontWeight:'900',marginTop:6},
 section:{color:C.white,fontSize:16,fontWeight:'900',marginTop:24,marginBottom:2},next:{color:C.cyan,fontSize:16,lineHeight:22,fontWeight:'900'},
 quest:{marginTop:10,padding:15,borderWidth:1,borderColor:C.lineBright,borderRadius:16,backgroundColor:'rgba(5,17,20,.92)'},done:{opacity:.55},locked:{opacity:.62},
 questCode:{flex:1,minWidth:0,color:C.cyan,fontSize:8,fontWeight:'900',letterSpacing:.9},questStatus:{color:C.warning,fontSize:8,fontWeight:'900'},questTitle:{color:C.white,fontSize:18,lineHeight:23,fontWeight:'900',marginTop:7},questSkills:{color:C.cyanSoft,fontSize:8,fontWeight:'900',marginTop:9},
 skillGrid:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:9},skill:{width:'31%',minWidth:94,padding:11,borderWidth:1,borderColor:C.line,borderRadius:13,backgroundColor:'rgba(4,16,20,.88)'},skillName:{color:C.cyan,fontSize:8,fontWeight:'900'},skillLevel:{color:C.white,fontSize:17,fontWeight:'900',marginTop:5},skillXp:{color:C.textVeryMuted,fontSize:8,marginTop:3},
 historyRow:{flexDirection:'row',justifyContent:'space-between',paddingVertical:7,borderBottomWidth:1,borderBottomColor:'rgba(108,238,255,.08)'},historyDay:{color:C.textMuted,fontSize:9,fontWeight:'800'},historyMinutes:{color:C.white,fontSize:10,fontWeight:'900'},
 safety:{marginTop:12,padding:16,borderWidth:1,borderColor:'rgba(108,238,255,.38)',borderRadius:18,backgroundColor:'rgba(4,16,20,.94)'}
});
