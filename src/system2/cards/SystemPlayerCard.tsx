import {Image,Share,StyleSheet,Text,View} from 'react-native';
import Animated,{FadeInDown} from 'react-native-reanimated';
import Action from '../components/Action';
import type {PlayerProfile} from '../core/types';
import {buildSystemCard,type CardReason} from './engine';

const rarityAccent={
  R:'#7e99a5',SR:'#6ceeff',SSR:'#9d7cff',UR:'#ff9c5a',MYTHIC:'#ffd66c',SYSTEM_EXCLUSIVE:'#ffffff',
} as const;

export default function SystemPlayerCard({player,reason='PROFILE'}:{player:PlayerProfile;reason?:CardReason}){
  const card=buildSystemCard(player,reason);
  const accent=rarityAccent[card.rarity];
  return <Animated.View entering={FadeInDown.duration(420)} style={[styles.card,{borderColor:accent,shadowColor:accent}]}>
    <View style={styles.top}>
      <View><Text style={[styles.kicker,{color:accent}]}>SYSTEM SPECIAL CARD // {card.rarity}</Text><Text style={styles.title}>{card.title}</Text></View>
      <View style={[styles.rarity,{borderColor:accent}]}><Text style={[styles.rarityText,{color:accent}]}>{card.rarity}</Text></View>
    </View>
    <View style={styles.hero}>
      <View style={[styles.aura,{borderColor:accent}]} />
      {player.avatarUri?<Image source={{uri:player.avatarUri}} style={[styles.avatar,{borderColor:accent}]}/>:<View style={[styles.avatar,styles.placeholder,{borderColor:accent}]}><Text style={[styles.placeholderText,{color:accent}]}>PLAYER</Text></View>}
      <View style={styles.stats}>
        <Text style={styles.meta}>LV. {card.level}</Text>
        <Text style={[styles.power,{color:accent}]}>{card.power.toLocaleString()}</Text>
        <Text style={styles.meta}>POWER</Text>
        <Text style={styles.meta}>RANK {card.rank}</Text>
      </View>
    </View>
    <View style={styles.line}/>
    <View style={styles.row}><Text style={styles.label}>EVOLUTION</Text><Text style={styles.value}>{card.evolution}</Text></View>
    <View style={styles.row}><Text style={styles.label}>ARCHETYPE</Text><Text style={styles.value}>{card.style.replaceAll('_',' ')}</Text></View>
    <View style={styles.row}><Text style={styles.label}>SPECIAL</Text><Text style={styles.value}>{card.subtitle}</Text></View>
    <Action label="UDOSTĘPNIJ KARTĘ →" onPress={()=>{void Share.share({message:card.shareCaption})}}/>
  </Animated.View>;
}

const styles=StyleSheet.create({
  card:{marginTop:16,padding:18,borderRadius:24,borderWidth:1.5,backgroundColor:'rgba(3,8,12,.92)',shadowOpacity:.32,shadowRadius:18},
  top:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',gap:12},
  kicker:{fontSize:9,fontWeight:'900',letterSpacing:1.4},title:{color:'#fff',fontSize:21,fontWeight:'900',marginTop:7,maxWidth:250},
  rarity:{borderWidth:1,borderRadius:10,paddingHorizontal:10,paddingVertical:7},rarityText:{fontSize:10,fontWeight:'900'},
  hero:{height:220,marginTop:18,alignItems:'center',justifyContent:'center',overflow:'hidden'},
  aura:{position:'absolute',width:185,height:185,borderRadius:93,borderWidth:1.5,transform:[{rotate:'45deg'}],opacity:.5},
  avatar:{width:126,height:126,borderRadius:63,borderWidth:2},placeholder:{alignItems:'center',justifyContent:'center',backgroundColor:'#071219'},
  placeholderText:{fontSize:12,fontWeight:'900',letterSpacing:2},
  stats:{position:'absolute',right:0,bottom:8,alignItems:'flex-end'},meta:{color:'#8aa0aa',fontSize:9,fontWeight:'900',letterSpacing:1},
  power:{fontSize:24,fontWeight:'900',marginVertical:2},
  line:{height:1,backgroundColor:'rgba(120,180,200,.18)',marginVertical:12},
  row:{flexDirection:'row',justifyContent:'space-between',gap:12,marginTop:7},label:{color:'#657b85',fontSize:9,fontWeight:'900'},value:{color:'#dffaff',fontSize:9,fontWeight:'900',textAlign:'right'},
});
