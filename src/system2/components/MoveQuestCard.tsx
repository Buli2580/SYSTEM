import {Pressable,StyleSheet,Text,View} from 'react-native';
import type {MoveQuest} from '../move/types';

const ACCENT:Record<MoveQuest['difficulty'],string>={
  EASY:'#6ceeff',NORMAL:'#9d7cff',CHALLENGE:'#ffd36c',
};

export default function MoveQuestCard({
  quest,done=false,locked=false,onPress,
}:{quest:MoveQuest;done?:boolean;locked?:boolean;onPress:()=>void}){
  const accent=ACCENT[quest.difficulty];
  const status=done?'COMPLETE':locked?'LOCKED':'START';
  return <Pressable accessibilityRole="button" accessibilityLabel={quest.title} disabled={done||locked} onPress={onPress}
    style={({pressed})=>[styles.root,{borderColor:accent+'66'},done&&styles.done,locked&&styles.locked,pressed&&styles.pressed]}>
    <View style={styles.top}>
      <Text style={[styles.code,{color:accent}]}>{quest.kind} // {quest.minutes} MIN</Text>
      <Text style={[styles.status,{color:done?'#66e3a4':locked?'#657b85':accent}]}>{status}</Text>
    </View>
    <Text style={styles.title}>{quest.title}</Text>
    <Text style={styles.body}>{quest.description}</Text>
    <View style={styles.chips}>
      {quest.skills.map(skill=><View key={skill} style={[styles.chip,{borderColor:accent+'44'}]}><Text style={[styles.chipText,{color:accent}]}>{skill}</Text></View>)}
    </View>
    <View style={styles.bottom}>
      <Text style={styles.verification}>VERIFY // {quest.verification.replaceAll('_',' ')}</Text>
      <Text style={styles.difficulty}>{quest.difficulty}</Text>
    </View>
  </Pressable>;
}

const styles=StyleSheet.create({
  root:{marginTop:10,padding:15,borderWidth:1,borderRadius:17,backgroundColor:'rgba(5,17,20,.94)'},
  top:{flexDirection:'row',justifyContent:'space-between',gap:10},
  code:{flex:1,minWidth:0,fontSize:8,fontWeight:'900',letterSpacing:1},
  status:{fontSize:8,fontWeight:'900',letterSpacing:.8},
  title:{color:'#fff',fontSize:18,lineHeight:23,fontWeight:'900',marginTop:7},
  body:{color:'#8da5af',fontSize:10,lineHeight:16,marginTop:6},
  chips:{flexDirection:'row',flexWrap:'wrap',gap:6,marginTop:10},
  chip:{borderWidth:1,borderRadius:999,paddingHorizontal:8,paddingVertical:5,backgroundColor:'rgba(255,255,255,.018)'},
  chipText:{fontSize:7,fontWeight:'900',letterSpacing:.7},
  bottom:{flexDirection:'row',justifyContent:'space-between',gap:10,marginTop:11,paddingTop:9,borderTopWidth:1,borderTopColor:'rgba(108,238,255,.08)'},
  verification:{flex:1,minWidth:0,color:'#6f8791',fontSize:7,fontWeight:'900',letterSpacing:.65},
  difficulty:{color:'#a9bdc6',fontSize:7,fontWeight:'900'},
  done:{opacity:.58},
  locked:{opacity:.45},
  pressed:{opacity:.8,transform:[{scale:.99}]},
});
