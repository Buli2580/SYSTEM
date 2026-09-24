import {StyleSheet,Text,View,type DimensionValue} from 'react-native';
import type {SocialSeason} from '../social/seasons';

function remaining(ms:number){const d=Math.floor(ms/86400000),h=Math.floor((ms%86400000)/3600000);return d>0?(d+'D '+h+'H'):(h+'H');}
export default function SeasonCycleCard({season,progress,countdown}:{season:SocialSeason;progress:number;countdown:number}){
  const pct=Math.max(0,Math.min(100,Math.round(progress*100)));
  return <View style={styles.root}>
    <View style={styles.top}><Text style={styles.code}>SEASON CYCLE // ACTIVE</Text><Text style={styles.time}>{remaining(countdown)}</Text></View>
    <Text style={styles.title}>{season.name}</Text>
    <Text style={styles.dates}>{season.startsAt.slice(0,10)} → {season.endsAt.slice(0,10)}</Text>
    <View style={styles.hero}>
      <View style={styles.ringOuter}/><View style={styles.ringInner}/>
      <Text style={styles.pct}>{pct}%</Text><Text style={styles.pctLabel}>CYCLE</Text>
    </View>
    <View style={styles.track}><View style={[styles.fill,{width:(Math.max(2,pct)+'%') as DimensionValue}]}/></View>
    <Text style={styles.footer}>Reward Track i Season XP pojawią się dopiero wtedy, gdy backend będzie zwracał kanoniczne punkty sezonowe.</Text>
  </View>;
}
const styles=StyleSheet.create({
  root:{marginTop:12,padding:18,borderWidth:1,borderColor:'rgba(88,215,255,.38)',borderRadius:22,backgroundColor:'rgba(3,12,19,.94)'},
  top:{flexDirection:'row',justifyContent:'space-between',gap:12},
  code:{color:'#58d7ff',fontSize:8,fontWeight:'900',letterSpacing:1.2},
  time:{color:'#ffd36c',fontSize:9,fontWeight:'900'},
  title:{color:'#fff',fontSize:24,lineHeight:30,fontWeight:'900',marginTop:8},
  dates:{color:'#718791',fontSize:9,fontWeight:'800',marginTop:4},
  hero:{height:150,alignItems:'center',justifyContent:'center'},
  ringOuter:{position:'absolute',width:126,height:126,borderRadius:63,borderWidth:1,borderColor:'rgba(88,215,255,.24)'},
  ringInner:{position:'absolute',width:90,height:90,borderRadius:45,borderWidth:1,borderColor:'rgba(157,124,255,.28)',transform:[{rotate:'45deg'}]},
  pct:{color:'#fff',fontSize:35,fontWeight:'900'},
  pctLabel:{color:'#58d7ff',fontSize:8,fontWeight:'900',letterSpacing:1.2},
  track:{height:7,borderRadius:99,overflow:'hidden',backgroundColor:'#122934'},
  fill:{height:'100%',backgroundColor:'#58d7ff'},
  footer:{color:'#657b85',fontSize:8,lineHeight:13,marginTop:10},
});
