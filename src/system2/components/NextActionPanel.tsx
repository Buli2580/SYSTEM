import {Pressable,StyleSheet,Text,View} from 'react-native';
import Animated,{FadeInUp} from 'react-native-reanimated';
import type {NextAction} from '../quests/nextAction';

const ACCENT:Record<NextAction['kind'],string>={
  RESUME:'#36e69a',AWAKENING:'#6ceeff',DAILY:'#6ceeff',STORY:'#9d7cff',BOSS:'#ff708c',
  WORLD_EVENT:'#ffd36c',ACHIEVEMENTS:'#ffd36c',PROGRESSION:'#6ceeff',GOAL:'#9d7cff',JOURNEY:'#9d7cff',
};

export default function NextActionPanel({action,onPress}:{action:NextAction;onPress:()=>void}){
  const accent=ACCENT[action.kind];
  return <Animated.View entering={FadeInUp.duration(300)} style={[styles.root,{borderColor:accent+'77'}]}>
    <View style={styles.top}>
      <Text style={[styles.code,{color:accent}]}>SYSTEM // NEXT ACTION</Text>
      <Text style={styles.priority}>PRIORITY {action.priority}</Text>
    </View>
    <Text style={styles.kind}>{action.kind.replaceAll('_',' ')}</Text>
    <Text style={styles.title}>{action.title}</Text>
    <Text style={styles.detail}>{action.detail}</Text>
    <Pressable accessibilityRole="button" onPress={onPress} style={({pressed})=>[styles.action,{backgroundColor:accent},pressed&&styles.pressed]}>
      <Text style={styles.actionText}>{action.kind==='RESUME'?'WRÓĆ DO MISJI':'CONTINUE'}</Text>
      <Text style={styles.arrow}>→</Text>
    </Pressable>
  </Animated.View>;
}
const styles=StyleSheet.create({
  root:{marginTop:14,padding:18,borderWidth:1,borderRadius:22,backgroundColor:'rgba(3,13,17,.96)'},
  top:{flexDirection:'row',justifyContent:'space-between',gap:12},
  code:{fontSize:8,fontWeight:'900',letterSpacing:1.4},
  priority:{color:'#627781',fontSize:8,fontWeight:'900'},
  kind:{color:'#78909a',fontSize:8,fontWeight:'900',letterSpacing:1.2,marginTop:10},
  title:{color:'#fff',fontSize:24,lineHeight:30,fontWeight:'900',marginTop:5},
  detail:{color:'#9bb0b9',fontSize:11,lineHeight:17,marginTop:7},
  action:{minHeight:54,borderRadius:14,marginTop:16,paddingHorizontal:17,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  actionText:{color:'#001014',fontSize:11,fontWeight:'900',letterSpacing:1.2},
  arrow:{color:'#001014',fontSize:25,fontWeight:'900'},
  pressed:{opacity:.86,transform:[{scale:.99}]},
});
