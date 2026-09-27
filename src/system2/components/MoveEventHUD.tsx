import {StyleSheet,Text,View} from 'react-native';
import Animated,{FadeInUp} from 'react-native-reanimated';
import type {MoveWorldEvent} from '../move/types';

function remaining(endsAt:string,now=Date.now()){
  const ms=Math.max(0,new Date(endsAt).getTime()-now);
  const h=Math.floor(ms/3600000);
  const m=Math.floor((ms%3600000)/60000);
  return h>0?`${h}H ${String(m).padStart(2,'0')}MIN`:`${m}MIN`;
}
const ACCENT:Record<MoveWorldEvent['kind'],string>={
  RUN_SIGNAL:'#6ceeff',
  JUMP_ANOMALY:'#ffd36c',
  OUTDOOR_PORTAL:'#9d7cff',
  BIKE_EVENT:'#58d7ff',
  BALL_CHALLENGE:'#ff9c5a',
};

export default function MoveEventHUD({event,now=Date.now()}:{event:MoveWorldEvent;now?:number}){
  const accent=ACCENT[event.kind];
  return <Animated.View entering={FadeInUp.duration(340)} style={[styles.root,{borderColor:accent+'88'}]}>
    <View style={styles.top}>
      <Text style={[styles.code,{color:accent}]}>MOVE EVENT // {event.kind.replaceAll('_',' ')}</Text>
      <Text style={styles.timer}>{remaining(event.endsAt,now)}</Text>
    </View>
    <Text style={styles.title}>{event.title}</Text>
    <Text style={styles.body}>{event.minutes} MIN ACTIVE WINDOW · MOVEMENT SKILL {event.skill}</Text>
    <View style={styles.bottom}>
      <View style={[styles.skill,{borderColor:accent+'66'}]}><Text style={[styles.skillText,{color:accent}]}>{event.skill}</Text></View>
      <Text style={styles.directive}>EVENT WINDOW // 3H</Text>
    </View>
  </Animated.View>;
}
const styles=StyleSheet.create({
  root:{marginTop:14,padding:16,borderWidth:1,borderRadius:19,backgroundColor:'rgba(11,10,24,.78)'},
  top:{flexDirection:'row',justifyContent:'space-between',gap:10},
  code:{flex:1,minWidth:0,fontSize:8,lineHeight:12,fontWeight:'900',letterSpacing:1.1},
  timer:{color:'#ffd36c',fontSize:8,fontWeight:'900'},
  title:{color:'#fff',fontSize:20,lineHeight:25,fontWeight:'900',marginTop:7},
  body:{color:'#93a8b2',fontSize:10,lineHeight:16,marginTop:6},
  bottom:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:10,marginTop:12},
  skill:{borderWidth:1,borderRadius:999,paddingHorizontal:10,paddingVertical:6},
  skillText:{fontSize:8,fontWeight:'900',letterSpacing:.9},
  directive:{color:'#667d87',fontSize:8,fontWeight:'900',letterSpacing:.8},
});
