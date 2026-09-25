import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import SystemPage from '../components/SystemPage';

export default function FamilySchoolScreen(){
 return <SystemPage title="GUARDIAN" subtitle="FAMILY // SCHOOL">
  <Animated.View entering={FadeInDown.duration(380)} style={s.hero}><Text style={s.code}>ADULT CONTROL LAYER</Text><Text style={s.title}>SUPPORT, NOT GAMEPLAY</Text><Text style={s.body}>Parent and teacher controls stay separate from the player's RPG world. Adults see clear activity and approval states; children keep the game experience.</Text></Animated.View>
  <Panel code="FAMILY" title="PARENT PANEL" rows={['Movement mission approvals','Daily activity summary','Safety / privacy controls','Age-appropriate mission rules']}/>
  <Panel code="SCHOOL" title="TEACHER PANEL" rows={['Class movement challenges','Participation overview','Team goals without public body metrics','Teacher-approved activities']}/>
  <Panel code="VERIFICATION" title="TRUST LAYER" rows={['GPS: supported by current quest verifier','Timer: supported by current quest verifier','Steps / Health: adapter pending','Parent approval: explicit guardian signal pending']}/>
  <Text style={s.note}>No child location, health data or approval is fabricated. Unsupported verification stays visibly pending until its adapter exists.</Text>
 </SystemPage>;
}
function Panel({code,title,rows}:{code:string;title:string;rows:string[]}){return <View style={s.panel}><Text style={s.code}>{code}</Text><Text style={s.panelTitle}>{title}</Text>{rows.map(x=><Text key={x} style={s.row}>› {x}</Text>)}</View>}
const s=StyleSheet.create({hero:{padding:20,borderWidth:1,borderColor:'rgba(88,226,255,.3)',backgroundColor:'#07151a',marginBottom:10},code:{color:'#62eaff',fontSize:8,fontWeight:'900',letterSpacing:2},title:{color:'#fff',fontSize:25,fontWeight:'900',marginTop:7},body:{color:'#91a9b1',fontSize:11,lineHeight:18,marginTop:8},panel:{padding:17,borderWidth:1,borderColor:'#1b424b',backgroundColor:'#050e12',marginBottom:9},panelTitle:{color:'#fff',fontSize:17,fontWeight:'900',marginVertical:7},row:{color:'#9bb0b6',fontSize:10,lineHeight:20},note:{color:'#627d84',fontSize:8,lineHeight:14,marginTop:5}});