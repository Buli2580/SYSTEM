import {Pressable,StyleSheet,Text,View} from 'react-native';
import {MissionAction} from './model';
export default function MissionFocus({title,subtitle,action,progress,total,reward,mission,onChoice}:{title:string;subtitle:string;action:MissionAction;progress:number;total:number;reward:number;mission?:import('../gameMaster/types').MissionDirective;onChoice?:()=>void}) {
 return <View testID="home-mission-focus" style={s.root}>
  <Text style={s.kicker}>{mission?`${mission.campaign.arc} · ${mission.campaign.chain} · ${mission.campaign.stage}/5`:`MISJA // ${progress}/${total}`}</Text>
  <Text style={s.title}>{title}</Text>
  <Text style={s.subtitle}>{subtitle}</Text>
  {mission&&onChoice&&<Pressable accessibilityRole="button" accessibilityLabel="Zmień kierunek następnych misji" onPress={onChoice} style={{minHeight:44,justifyContent:'center'}}><Text style={s.subtitle}>Kierunek: {mission.campaign.choice} · zmień →</Text></Pressable>}
  <Pressable accessibilityRole="button" accessibilityState={{disabled:!!action.disabled}} disabled={action.disabled} onPress={action.onPress} style={({pressed})=>[s.action,pressed&&{opacity:.8}]}>
   <Text style={s.label}>{action.label}</Text><Text style={s.label}>+{reward} XP →</Text>
  </Pressable>
 </View>;
}
const s=StyleSheet.create({root:{padding:16,backgroundColor:'rgba(2,9,15,.86)',borderTopWidth:1,borderColor:'rgba(100,220,245,.4)'},kicker:{color:'#83ccdc',fontSize:11,letterSpacing:1},title:{color:'#fff',fontSize:20,fontWeight:'800',marginTop:5},subtitle:{color:'#c1d3de',fontSize:12,lineHeight:17,marginTop:5},action:{minHeight:48,marginTop:12,backgroundColor:'#6ceeff',padding:12,flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:8,flexWrap:'wrap'},label:{color:'#04141c',fontWeight:'800',fontSize:13}});
