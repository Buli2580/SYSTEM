import {Text,View} from 'react-native';
import Animated,{FadeInUp} from 'react-native-reanimated';
import {pageStyles as s} from './SystemPage';

function Counter({value,label,index}:{value:number;label:string;index:number}){
 return <Animated.View entering={FadeInUp.delay(index*80).duration(320)} style={{flex:1,minWidth:92,paddingVertical:16,paddingHorizontal:12,borderWidth:1,borderColor:'#17333e',borderRadius:16,backgroundColor:'#061116'}}>
  <Text style={{color:'#fff',fontSize:24,fontWeight:'900'}}>{value.toLocaleString()}</Text>
  <Text style={{color:'#6ceeff',fontSize:9,fontWeight:'900',letterSpacing:1.2,marginTop:5}}>{label}</Text>
 </Animated.View>
}
export default function SocialCounters({followers,following,friends}:{followers:number;following:number;friends:number}){
 return <View style={s.panel}><Text style={s.label}>NETWORK</Text><View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:14}}>
  <Counter value={followers} label="FOLLOWERS" index={0}/><Counter value={following} label="FOLLOWING" index={1}/><Counter value={friends} label="FRIENDS" index={2}/>
 </View></View>
}