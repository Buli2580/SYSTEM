import {Share,StyleSheet,Text,View} from 'react-native';
import Animated,{FadeInUp} from 'react-native-reanimated';
import Action from '../components/Action';
import type {MovementProgressCard as CardModel} from '../move/card';

export default function MovementProgressCard({card}:{card:CardModel}){
  const pct=Math.max(0,Math.min(100,Math.round(card.activeMinutes/60*100)));
  return <Animated.View entering={FadeInUp.duration(360)} style={styles.root}>
    <View style={styles.top}>
      <View style={{flex:1,minWidth:0}}>
        <Text style={styles.code}>SYSTEM MOVE CARD // ACTIVE</Text>
        <Text style={styles.title}>{card.title}</Text>
        <Text style={styles.subtitle}>{card.subtitle}</Text>
      </View>
      <View style={styles.badge}><Text style={styles.badgeText}>{pct}%</Text></View>
    </View>
    <View style={styles.hero}>
      <View style={styles.ringOuter}/>
      <View style={styles.ringInner}/>
      <Text style={styles.minutes}>{card.activeMinutes}</Text>
      <Text style={styles.minutesLabel}>ACTIVE MIN</Text>
    </View>
    <View style={styles.track}><View style={[styles.fill,{width:`${Math.max(2,pct)}%`}]} /></View>
    <View style={styles.stats}>
      <Info label="STREAK" value={card.streak+' DAYS'}/>
      <Info label="BEST SKILL" value={card.bestSkill}/>
      <Info label="SKILL LV." value={String(card.bestSkillLevel)}/>
    </View>
    <Action label="UDOSTĘPNIJ MOVE CARD →" onPress={()=>{void Share.share({title:'SYSTEM MOVE',message:card.shareText});}}/>
  </Animated.View>;
}
function Info({label,value}:{label:string;value:string}){return <View style={styles.info}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>}
const styles=StyleSheet.create({
  root:{marginTop:12,padding:18,borderRadius:24,borderWidth:1,borderColor:'rgba(108,238,255,.38)',backgroundColor:'rgba(2,10,14,.95)',overflow:'hidden'},
  top:{flexDirection:'row',justifyContent:'space-between',gap:12},
  code:{color:'#6ceeff',fontSize:8,fontWeight:'900',letterSpacing:1.25},
  title:{color:'#fff',fontSize:21,lineHeight:27,fontWeight:'900',marginTop:6},
  subtitle:{color:'#78909a',fontSize:9,lineHeight:14,fontWeight:'800',marginTop:5},
  badge:{width:54,height:54,borderRadius:27,borderWidth:1,borderColor:'#6ceeff',alignItems:'center',justifyContent:'center',backgroundColor:'rgba(0,229,255,.06)'},
  badgeText:{color:'#6ceeff',fontSize:14,fontWeight:'900'},
  hero:{height:150,alignItems:'center',justifyContent:'center',marginTop:8},
  ringOuter:{position:'absolute',width:128,height:128,borderRadius:64,borderWidth:1,borderColor:'rgba(108,238,255,.22)'},
  ringInner:{position:'absolute',width:94,height:94,borderRadius:47,borderWidth:1,borderColor:'rgba(228,186,255,.32)',transform:[{rotate:'45deg'}]},
  minutes:{color:'#fff',fontSize:38,lineHeight:43,fontWeight:'900'},
  minutesLabel:{color:'#6ceeff',fontSize:8,fontWeight:'900',letterSpacing:1.4,marginTop:2},
  track:{height:7,borderRadius:99,overflow:'hidden',backgroundColor:'#16313a'},
  fill:{height:'100%',backgroundColor:'#6ceeff'},
  stats:{flexDirection:'row',gap:7,marginTop:12},
  info:{flex:1,minWidth:0,padding:10,borderWidth:1,borderColor:'rgba(108,238,255,.12)',borderRadius:11,backgroundColor:'rgba(255,255,255,.02)'},
  label:{color:'#60757e',fontSize:7,fontWeight:'900',letterSpacing:.8},
  value:{color:'#fff',fontSize:10,fontWeight:'900',marginTop:4},
});
