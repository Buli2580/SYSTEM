import {Pressable,StyleSheet,Text,View} from 'react-native';
import {useRouter} from 'expo-router';
import Animated,{FadeInUp} from 'react-native-reanimated';
import type {SocialCounts} from '../social';

type Item={key:string;title:string;detail:string;route:'/leaderboard'|'/friends'|'/guilds'|'/raids'|'/seasons';accent:string};
const ITEMS:Item[]=[
  {key:'rank',title:'RANKINGI',detail:'WORLD / COUNTRY / CITY',route:'/leaderboard',accent:'#ffd36c'},
  {key:'friends',title:'ZNAJOMI',detail:'REQUESTS / FRIENDS',route:'/friends',accent:'#6ceeff'},
  {key:'guilds',title:'GILDIE',detail:'TEAMS / GUILD XP',route:'/guilds',accent:'#9d7cff'},
  {key:'raids',title:'RAIDS',detail:'GLOBAL BOSS',route:'/raids',accent:'#ff708c'},
  {key:'season',title:'SEZON',detail:'CURRENT CYCLE',route:'/seasons',accent:'#58d7ff'},
];
export default function SocialCommandDeck({online,counts}:{online:boolean|null;counts:SocialCounts}){
  const router=useRouter();
  return <Animated.View entering={FadeInUp.duration(340)} style={styles.root}>
    <View style={styles.header}>
      <View style={{flex:1,minWidth:0}}><Text style={styles.code}>SOCIAL COMMAND DECK // NETWORK</Text><Text style={styles.title}>SYSTEM ONLINE</Text></View>
      <View style={[styles.status,online===true?styles.statusOnline:styles.statusOffline]}><Text style={styles.statusText}>{online===null?'CHECK':online?'ONLINE':'LOCAL'}</Text></View>
    </View>
    <View style={styles.counts}>
      <Counter label="FOLLOWERS" value={counts.followers}/>
      <Counter label="FOLLOWING" value={counts.following}/>
      <Counter label="FRIENDS" value={counts.friends}/>
    </View>
    <View style={styles.grid}>
      {ITEMS.map(item=><Pressable key={item.key} accessibilityRole="button" onPress={()=>router.push(item.route)}
        style={({pressed})=>[styles.tile,{borderColor:item.accent+'55'},pressed&&styles.pressed]}>
        <View style={[styles.dot,{backgroundColor:item.accent}]}/>
        <Text style={styles.tileTitle}>{item.title}</Text>
        <Text style={styles.tileDetail}>{item.detail}</Text>
        <Text style={[styles.arrow,{color:item.accent}]}>→</Text>
      </Pressable>)}
    </View>
  </Animated.View>;
}
function Counter({label,value}:{label:string;value:number}){return <View style={styles.counter}><Text style={styles.counterValue}>{value}</Text><Text style={styles.counterLabel}>{label}</Text></View>}
const styles=StyleSheet.create({
  root:{marginTop:16,padding:18,borderWidth:1,borderColor:'rgba(108,238,255,.22)',borderRadius:24,backgroundColor:'rgba(2,9,13,.96)'},
  header:{flexDirection:'row',justifyContent:'space-between',gap:12,alignItems:'center'},
  code:{color:'#6ceeff',fontSize:8,fontWeight:'900',letterSpacing:1.3},
  title:{color:'#fff',fontSize:22,fontWeight:'900',marginTop:5},
  status:{borderWidth:1,borderRadius:999,paddingHorizontal:11,paddingVertical:7},
  statusOnline:{borderColor:'#36e69a',backgroundColor:'rgba(54,230,154,.06)'},
  statusOffline:{borderColor:'#60757e',backgroundColor:'rgba(96,117,126,.06)'},
  statusText:{color:'#dffaff',fontSize:8,fontWeight:'900',letterSpacing:1},
  counts:{flexDirection:'row',gap:8,marginTop:14},
  counter:{flex:1,padding:10,borderRadius:12,borderWidth:1,borderColor:'rgba(108,238,255,.10)',alignItems:'center'},
  counterValue:{color:'#fff',fontSize:18,fontWeight:'900'},
  counterLabel:{color:'#617780',fontSize:7,fontWeight:'900',letterSpacing:.8,marginTop:3},
  grid:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:12},
  tile:{width:'31%',flexGrow:1,minHeight:100,padding:11,borderWidth:1,borderRadius:14,backgroundColor:'rgba(255,255,255,.018)'},
  dot:{width:7,height:7,borderRadius:4},
  tileTitle:{color:'#fff',fontSize:10,fontWeight:'900',marginTop:8},
  tileDetail:{color:'#647984',fontSize:7,lineHeight:10,fontWeight:'800',marginTop:4},
  arrow:{fontSize:18,fontWeight:'900',marginTop:'auto',alignSelf:'flex-end'},
  pressed:{opacity:.78,transform:[{scale:.99}]},
});
