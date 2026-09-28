import {Text,View} from 'react-native';import ProgressionPulse from './ProgressionPulse';
import {ArtThumbnail} from './VisualArt';
import {ART} from '../visual/assets';
export default function BossStatusCard({title,hp,maxHp,status}:{title:string;hp:number;maxHp:number;status:string}){
 const safeMax=Math.max(1,maxHp),safeHp=Math.max(0,Math.min(hp,safeMax)),damage=safeMax-safeHp,percent=Math.round((safeHp/safeMax)*100);
 return <View style={{borderWidth:1,borderColor:'#6ceeff33',backgroundColor:'#051114',borderRadius:20,padding:18,gap:10,overflow:'hidden'}}>
  <View style={{position:'absolute',width:150,height:150,borderRadius:75,borderWidth:1,borderColor:'#e4baff22',right:-45,top:-55}}/>
  <ArtThumbnail source={ART.boss} label="Ilustracja bossa"/>
  <Text style={{color:'#e4baff',fontSize:9,fontWeight:'900',letterSpacing:2}}>BOSS // {status}</Text>
  <Text style={{color:'#fff',fontSize:22,fontWeight:'900'}}>{title}</Text>
  <ProgressionPulse label="HP" value={safeHp} max={safeMax}/>
  <View style={{flexDirection:'row',justifyContent:'space-between'}}><Text style={{color:'#8da5af',fontSize:11}}>{safeHp.toLocaleString()} / {safeMax.toLocaleString()} HP</Text><Text style={{color:'#6ceeff',fontSize:11,fontWeight:'900'}}>{percent}%</Text></View>
  <Text style={{color:'#8da5af',fontSize:10}}>NETWORK DAMAGE · {damage.toLocaleString()}</Text>
 </View>
}
