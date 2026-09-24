import {Pressable,StyleSheet,Text,View,type DimensionValue} from 'react-native';
import type {Guild} from '../social/guilds';

export default function GuildCard({guild,busy=false,onJoin}:{guild:Guild;busy?:boolean;onJoin:()=>void}){
  const pct=Math.max(8,Math.min(100,(guild.xp%10000)/100));
  return <View style={styles.root}>
    <View style={styles.top}>
      <View style={styles.emblem}><Text style={styles.emblemText}>{guild.tag.slice(0,3).toUpperCase()}</Text></View>
      <View style={styles.body}>
        <Text style={styles.code}>GUILD // {guild.tag} · LV {guild.level}</Text>
        <Text style={styles.title}>{guild.name}</Text>
        <Text style={styles.meta}>{guild.memberCount} PLAYERS · {guild.xp.toLocaleString()} GUILD XP</Text>
      </View>
    </View>
    <View style={styles.track}><View style={[styles.fill,{width:(pct+'%') as DimensionValue}]} /></View>
    <Text style={styles.hint}>Wkład graczy i próg kolejnego poziomu będą pokazywane po rozszerzeniu danych chmurowych.</Text>
    <Pressable accessibilityRole="button" disabled={busy} onPress={onJoin} style={({pressed})=>[styles.action,busy&&styles.disabled,pressed&&styles.pressed]}>
      <Text style={styles.actionText}>{busy?'SYNCHRONIZACJA…':'DOŁĄCZ DO GILDII →'}</Text>
    </Pressable>
  </View>;
}
const styles=StyleSheet.create({
  root:{marginTop:12,padding:17,borderWidth:1,borderColor:'rgba(157,124,255,.36)',borderRadius:20,backgroundColor:'rgba(12,8,24,.82)'},
  top:{flexDirection:'row',gap:13,alignItems:'center'},
  emblem:{width:58,height:58,borderRadius:16,borderWidth:1,borderColor:'#9d7cff',alignItems:'center',justifyContent:'center',backgroundColor:'rgba(157,124,255,.07)'},
  emblemText:{color:'#e4d9ff',fontSize:12,fontWeight:'900',letterSpacing:1},
  body:{flex:1,minWidth:0},
  code:{color:'#9d7cff',fontSize:8,fontWeight:'900',letterSpacing:1.1},
  title:{color:'#fff',fontSize:20,lineHeight:25,fontWeight:'900',marginTop:5},
  meta:{color:'#8297a0',fontSize:8,fontWeight:'900',marginTop:5},
  track:{height:5,borderRadius:99,overflow:'hidden',backgroundColor:'rgba(157,124,255,.10)',marginTop:13},
  fill:{height:'100%',backgroundColor:'#9d7cff'},
  hint:{color:'#667d87',fontSize:8,lineHeight:13,marginTop:8},
  action:{minHeight:48,borderRadius:13,borderWidth:1,borderColor:'rgba(157,124,255,.62)',alignItems:'center',justifyContent:'center',marginTop:13},
  actionText:{color:'#d6c8ff',fontSize:9,fontWeight:'900',letterSpacing:1},
  disabled:{opacity:.4},pressed:{opacity:.72},
});
