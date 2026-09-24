import {Pressable,StyleSheet,Text,View} from 'react-native';
import Animated,{FadeInUp} from 'react-native-reanimated';
import type {AIGameMasterResponse} from '../ai';

export default function AIDirectorPanel({
  response,loading=false,error,systemDebt=0,onRefresh,preview=false,
}:{response:AIGameMasterResponse|null;loading?:boolean;error?:string|null;systemDebt?:number;onRefresh?:()=>void;preview?:boolean}){
  const source=response?.source==='ai'?'AI ONLINE':response?'SAFE FALLBACK':'LOCAL CORE';
  const mode=response?.director.mode??(systemDebt>0?'recovery':'normal');
  const accent=mode==='challenge'?'#ffd36c':mode==='recovery'?'#ff8c9d':'#6ceeff';
  return <Animated.View entering={FadeInUp.duration(340)} style={[styles.root,{borderColor:accent+'66'}]}>
    <View style={styles.top}>
      <View style={{flex:1,minWidth:0}}>
        <Text style={[styles.code,{color:accent}]}>AI GAME MASTER // {source}</Text>
        <Text style={styles.mode}>{mode.toUpperCase()} MODE</Text>
      </View>
      <View style={[styles.node,{borderColor:accent}]}><View style={[styles.nodeCore,{backgroundColor:accent}]}/></View>
    </View>
    <Text style={styles.title}>{loading?'ANALIZA GRACZA…':response?.director.headline??'DAILY DIRECTOR'}</Text>
    <Text style={styles.body}>{response?.director.message??'SYSTEM analizuje cele, serię i ostatnie wyniki bez zmiany zasad nagród.'}</Text>
    {!!response?.briefing&&<View style={styles.briefing}><Text style={styles.briefingCode}>DIRECTOR BRIEFING</Text><Text style={styles.briefingText}>{response.briefing}</Text></View>}
    {systemDebt>0&&<Text style={styles.debt}>SYSTEM DEBT {systemDebt} // RECOVERY PROTOCOL MA PRIORYTET</Text>}
    {!!error&&<Text style={styles.error}>{error}</Text>}
    {!!response?.quests.length&&<View style={styles.quests}>
      <Text style={styles.previewCode}>{preview?'CAMPAIGN PREVIEW':'NEXT QUEST SIGNALS'}</Text>
      {response.quests.slice(0,3).map((q,index)=><View key={q.key} style={styles.quest}>
        <Text style={[styles.questIndex,{color:accent}]}>0{index+1}</Text>
        <View style={styles.questBody}>
          <Text style={styles.questTitle}>{q.title}</Text>
          <Text style={styles.questMeta}>{q.estimatedMinutes} MIN · {q.difficulty.toUpperCase()} · {q.verification.toUpperCase()}</Text>
          <Text style={styles.questReason}>{q.reason}</Text>
        </View>
      </View>)}
    </View>}
    {!!onRefresh&&<Pressable accessibilityRole="button" disabled={loading} onPress={onRefresh} style={({pressed})=>[styles.action,{borderColor:accent+'88'},loading&&styles.disabled,pressed&&styles.pressed]}>
      <Text style={[styles.actionText,{color:accent}]}>{loading?'AI ANALIZUJE…':'ODŚWIEŻ DIRECTOR →'}</Text>
    </Pressable>}
  </Animated.View>;
}
const styles=StyleSheet.create({
  root:{marginTop:14,padding:18,borderWidth:1,borderRadius:22,backgroundColor:'rgba(3,12,17,.95)',overflow:'hidden'},
  top:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:12},
  code:{fontSize:8,fontWeight:'900',letterSpacing:1.35},
  mode:{color:'#708690',fontSize:8,fontWeight:'900',letterSpacing:1.1,marginTop:4},
  node:{width:44,height:44,borderRadius:22,borderWidth:1,alignItems:'center',justifyContent:'center'},
  nodeCore:{width:12,height:12,borderRadius:6},
  title:{color:'#fff',fontSize:23,lineHeight:29,fontWeight:'900',marginTop:14},
  body:{color:'#9bb0b9',fontSize:11,lineHeight:18,marginTop:8},
  briefing:{marginTop:13,padding:12,borderRadius:13,borderWidth:1,borderColor:'rgba(108,238,255,.12)',backgroundColor:'rgba(255,255,255,.02)'},
  briefingCode:{color:'#60757e',fontSize:7,fontWeight:'900',letterSpacing:1},
  briefingText:{color:'#d9edf3',fontSize:10,lineHeight:16,marginTop:5},
  debt:{color:'#ff9aaa',fontSize:8,lineHeight:13,fontWeight:'900',letterSpacing:.8,marginTop:12},
  error:{color:'#ffb9b9',fontSize:9,lineHeight:14,marginTop:10},
  quests:{marginTop:15,paddingTop:12,borderTopWidth:1,borderTopColor:'rgba(108,238,255,.09)'},
  previewCode:{color:'#667d87',fontSize:8,fontWeight:'900',letterSpacing:1.1},
  quest:{flexDirection:'row',gap:10,paddingVertical:10,borderBottomWidth:1,borderBottomColor:'rgba(108,238,255,.06)'},
  questIndex:{width:24,fontSize:8,fontWeight:'900'},
  questBody:{flex:1,minWidth:0},
  questTitle:{color:'#fff',fontSize:11,lineHeight:16,fontWeight:'900'},
  questMeta:{color:'#718791',fontSize:7,lineHeight:11,fontWeight:'900',marginTop:3},
  questReason:{color:'#8fa4ad',fontSize:8,lineHeight:13,marginTop:4},
  action:{marginTop:14,minHeight:48,borderWidth:1,borderRadius:13,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(255,255,255,.018)'},
  actionText:{fontSize:9,fontWeight:'900',letterSpacing:1.1},
  disabled:{opacity:.45},pressed:{opacity:.75},
});
