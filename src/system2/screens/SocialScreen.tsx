import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import SystemPage from '../components/SystemPage';
import { useSystem } from '../state/SystemProvider';

export default function SocialScreen(){
 const { player }=useSystem();
 return <SystemPage title="SOCIAL" subtitle="NETWORK // GUILD HALL">
  <Animated.View entering={FadeInDown.duration(420)} style={s.hero}>
   <Text style={s.code}>PLAYER SIGNAL // ONLINE LAYER</Text><Text style={s.title}>{player.displayName}</Text>
   <Text style={s.rank}>RANK {player.rank} · LEVEL {player.realLevel}</Text>
   <Text style={s.meta}>{player.currentTitle} · {player.verifiedQuestCount} VERIFIED QUESTS</Text>
  </Animated.View>
  <View style={s.grid}>
   <Tile code="GUILD HALL" title="FORM A GUILD" body="Create squads, share progression and prepare cooperative objectives." state="FOUNDATION"/>
   <Tile code="PVP CHALLENGE" title="PLAYER VS PLAYER" body="Challenge real actions — verification decides the result, not purchased power." state="FOUNDATION"/>
   <Tile code="RAID LOBBY" title="CO-OP RAID" body="Players contribute verified real-world actions to one shared threat." state="FOUNDATION"/>
   <Tile code="RANKING" title="WORLD SIGNAL" body="Global and friend rankings will compare verified progression." state="FOUNDATION"/>
  </View>
  <Text style={s.note}>SOCIAL 3.0 // presentation layer ready for online backend. No fake players or fabricated rankings are shown.</Text>
 </SystemPage>;
}
function Tile({code,title,body,state}:{code:string;title:string;body:string;state:string}){return <View style={s.tile}><Text style={s.code}>{code}</Text><Text style={s.tileTitle}>{title}</Text><Text style={s.body}>{body}</Text><Text style={s.state}>{state}</Text></View>}
const s=StyleSheet.create({hero:{padding:22,borderWidth:1,borderColor:'rgba(98,239,255,.25)',backgroundColor:'#050b11',marginBottom:14},code:{color:'#62efff',fontSize:8,fontWeight:'900',letterSpacing:2},title:{color:'#fff',fontSize:30,fontWeight:'900',marginTop:8},rank:{color:'#b79cff',fontSize:11,fontWeight:'900',letterSpacing:1.5,marginTop:5},meta:{color:'#78939c',fontSize:9,marginTop:7},grid:{gap:10},tile:{minHeight:132,padding:16,borderWidth:1,borderColor:'#173944',backgroundColor:'rgba(3,10,15,.88)'},tileTitle:{color:'#fff',fontSize:18,fontWeight:'900',marginTop:7},body:{color:'#8da3aa',fontSize:11,lineHeight:17,marginTop:7},state:{color:'#765CFF',fontSize:7,fontWeight:'900',letterSpacing:1.5,marginTop:12},note:{color:'#5e7881',fontSize:8,lineHeight:14,marginTop:16}});