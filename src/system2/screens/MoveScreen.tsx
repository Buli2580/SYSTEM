import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import SystemPage from '../components/SystemPage';
import { useSystem } from '../state/SystemProvider';
import { getQuest } from '../quests/catalog';

const skills=[['SPEED','Run / sprint'],['BALANCE','Control'],['COORDINATION','Move well'],['JUMP','Power'],['THROW','Accuracy'],['CATCH','Reaction'],['ENDURANCE','Keep moving']] as const;
export default function MoveScreen(){
 const {player,daily,completedQuestIds}=useSystem();
 const streak=Math.max(0,player.streak);
 const moveQuests=(daily?.questIds??[]).map(getQuest).filter(q=>q?.activityType==='WALK'||q?.activityType==='RUN'||q?.activityType==='BIKE');
 const completedMove=moveQuests.filter(q=>q&&completedQuestIds.includes(q.id)).length;
 const moveMinutes=moveQuests.reduce((sum,q)=>sum+(q&&completedQuestIds.includes(q.id)?Math.max(0,Math.round((q.verification.type==='TIMER'||q.verification.type==='MULTI'?q.verification.minimumDurationSeconds:0)/60)):0),0);
 const targetMinutes=60;
 return <SystemPage title="MOVE" subtitle="REAL BODY // REAL PROGRESS">
  <Animated.View entering={FadeInDown.duration(420)} style={s.hero}><Text style={s.code}>MOVE // ACTIVE MODE</Text><Text style={s.title}>60 MIN MISSION</Text><Text style={s.big}>{Math.min(targetMinutes,moveMinutes)} / {targetMinutes} MIN</Text><Text style={s.body}>Walk, run, bike, play or train. Verified movement builds your physical progression.</Text></Animated.View>
  <View style={s.row}><Stat label="MOVE STREAK" value={streak+' DAYS'}/><Stat label="PLAYER LEVEL" value={String(player.realLevel)}/></View>
  <Text style={s.section}>MOVEMENT SKILLS</Text><View style={s.skills}>{skills.map(([a,b])=><View key={a} style={s.skill}><Text style={s.skillName}>{a}</Text><Text style={s.skillBody}>{b}</Text></View>)}</View>
  <Text style={s.section}>DAILY MOVE QUESTS · {completedMove}/{moveQuests.length}</Text>{moveQuests.length?moveQuests.map(q=><Mission key={q!.id} title={q!.title} body={(completedQuestIds.includes(q!.id)?'COMPLETE':'READY')+' · '+q!.activityType+' · '+q!.verification.type}/>):<Mission title="MOVE PROTOCOL" body="Daily movement mission will appear when the SYSTEM schedules one."/>}
  <Text style={s.note}>Verification adapters: GPS / steps / Health / Parent Approval. Final sensor wiring follows existing verification capabilities; unsupported signals are never faked.</Text>
 </SystemPage>;
}
function Stat({label,value}:{label:string;value:string}){return <View style={s.stat}><Text style={s.code}>{label}</Text><Text style={s.statValue}>{value}</Text></View>}
function Mission({title,body}:{title:string;body:string}){return <View style={s.mission}><Text style={s.missionTitle}>{title}</Text><Text style={s.body}>{body}</Text><Text style={s.ready}>MISSION READY</Text></View>}
const s=StyleSheet.create({hero:{padding:22,borderWidth:1,borderColor:'rgba(77,220,255,.3)',backgroundColor:'#061218'},code:{color:'#5be5ff',fontSize:8,fontWeight:'900',letterSpacing:2},title:{color:'#fff',fontSize:28,fontWeight:'900',marginTop:8},big:{color:'#9ef3ff',fontSize:20,fontWeight:'900',marginTop:8},body:{color:'#91a9b1',fontSize:11,lineHeight:17,marginTop:7},row:{flexDirection:'row',gap:10,marginTop:10},stat:{flex:1,padding:14,borderWidth:1,borderColor:'#183f49',backgroundColor:'#061015'},statValue:{color:'#fff',fontSize:16,fontWeight:'900',marginTop:5},section:{color:'#fff',fontSize:11,fontWeight:'900',letterSpacing:1.7,marginTop:20,marginBottom:9},skills:{flexDirection:'row',flexWrap:'wrap',gap:7},skill:{width:'31%',minWidth:90,padding:10,borderWidth:1,borderColor:'#1b4650',backgroundColor:'#07151a'},skillName:{color:'#70eaff',fontSize:8,fontWeight:'900'},skillBody:{color:'#708991',fontSize:8,marginTop:4},mission:{padding:15,borderWidth:1,borderColor:'#1a414b',backgroundColor:'#050e12',marginBottom:8},missionTitle:{color:'#fff',fontSize:15,fontWeight:'900'},ready:{color:'#69dfff',fontSize:7,fontWeight:'900',letterSpacing:1.5,marginTop:8},note:{color:'#5f7981',fontSize:8,lineHeight:14,marginTop:14}});