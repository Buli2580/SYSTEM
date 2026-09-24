import {Pressable,StyleSheet,Text,View} from 'react-native';
import type {LeaderboardEntry} from '../cloud/social';

export default function LeaderboardEntryCard({
  row,isMe=false,following=false,busy=false,onToggle,
}:{row:LeaderboardEntry;isMe?:boolean;following?:boolean;busy?:boolean;onToggle?:()=>void}){
  const podium=row.rank_position<=3;
  const accent=row.rank_position===1?'#ffd36c':row.rank_position===2?'#bcd6df':row.rank_position===3?'#d79969':'#6ceeff';
  return <View style={[styles.root,isMe&&styles.me,podium&&{borderColor:accent+'77'}]}>
    <View style={[styles.position,{borderColor:accent}]}>
      <Text style={[styles.positionText,{color:accent}]}>#{row.rank_position}</Text>
    </View>
    <View style={styles.body}>
      <Text style={styles.name}>@{row.handle??'gracz'}{isMe?' // YOU':''}</Text>
      <Text style={styles.publicName}>{row.public_name??'Gracz SYSTEMU'}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>LV {row.real_level}</Text>
        <Text style={[styles.meta,{color:accent}]}>RANK {row.rank}</Text>
        <Text style={styles.meta}>{row.real_total_xp.toLocaleString()} XP</Text>
      </View>
      <Text style={styles.followers}>{row.follower_count} OBSERWUJĄCYCH</Text>
    </View>
    {!isMe&&onToggle&&<Pressable accessibilityRole="button" disabled={busy} onPress={onToggle} style={({pressed})=>[styles.action,following&&styles.actionFollowing,busy&&styles.disabled,pressed&&styles.pressed]}>
      <Text style={styles.actionText}>{following?'✓':'+'}</Text>
    </Pressable>}
  </View>;
}
const styles=StyleSheet.create({
  root:{flexDirection:'row',alignItems:'center',gap:12,padding:13,marginTop:9,borderWidth:1,borderColor:'rgba(108,238,255,.14)',borderRadius:16,backgroundColor:'rgba(4,15,19,.88)'},
  me:{backgroundColor:'rgba(0,229,255,.05)',borderColor:'rgba(108,238,255,.45)'},
  position:{width:46,height:46,borderRadius:23,borderWidth:1,alignItems:'center',justifyContent:'center'},
  positionText:{fontSize:13,fontWeight:'900'},
  body:{flex:1,minWidth:0},
  name:{color:'#fff',fontSize:12,fontWeight:'900'},
  publicName:{color:'#879ba4',fontSize:9,marginTop:3},
  metaRow:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:6},
  meta:{color:'#6ceeff',fontSize:8,fontWeight:'900'},
  followers:{color:'#60757e',fontSize:7,fontWeight:'900',letterSpacing:.8,marginTop:5},
  action:{width:42,height:42,borderRadius:21,borderWidth:1,borderColor:'#6ceeff',alignItems:'center',justifyContent:'center'},
  actionFollowing:{borderColor:'#36e69a',backgroundColor:'rgba(54,230,154,.06)'},
  actionText:{color:'#fff',fontSize:16,fontWeight:'900'},
  disabled:{opacity:.4},pressed:{opacity:.7},
});
