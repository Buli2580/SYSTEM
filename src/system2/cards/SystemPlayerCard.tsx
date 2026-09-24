import {Image,Share,StyleSheet,Text,View} from 'react-native';
import Animated,{FadeInDown} from 'react-native-reanimated';
import Action from '../components/Action';
import type {PlayerProfile} from '../core/types';
import {buildSystemCard,type CardReason} from './engine';
import {queueTelemetry} from '../telemetry/amplitude';

export default function SystemPlayerCard({player,reason='PROFILE'}:{player:PlayerProfile;reason?:CardReason}){
  const card=buildSystemCard(player,reason);
  const accent=card.accent;
  const highTier=card.rarity==='MYTHIC'||card.rarity==='SYSTEM_EXCLUSIVE';
  return <Animated.View entering={FadeInDown.duration(420)} style={[styles.card,{borderColor:accent,shadowColor:accent}]}>
    <View style={[styles.frameLine,{borderColor:accent,opacity:highTier?.9:.45}]}/>
    <View style={styles.top}>
      <View style={styles.titleWrap}>
        <Text style={[styles.kicker,{color:accent}]}>SYSTEM CARD // {card.frame}</Text>
        <Text style={[styles.heroName,{color:accent}]}>{card.heroName}</Text>
        <Text style={styles.title}>{card.title}</Text>
        <Text style={styles.evolution}>{card.evolutionName} // STAGE {card.evolution}</Text>
      </View>
      <View style={[styles.rarity,{borderColor:accent,shadowColor:accent}]}><Text style={[styles.rarityText,{color:accent}]}>{card.rarity}</Text></View>
    </View>

    <View style={styles.hero}>
      <View style={[styles.auraOuter,{borderColor:accent}]}/>
      <View style={[styles.auraInner,{borderColor:accent}]}/>
      <View style={[styles.runeOne,{borderColor:accent}]}/>
      <View style={[styles.runeTwo,{borderColor:accent}]}/>
      {player.avatarUri
        ?<Image source={{uri:player.avatarUri}} style={[styles.avatar,{borderColor:accent}]}/>
        :<View style={[styles.avatar,styles.placeholder,{borderColor:accent}]}><Text style={[styles.placeholderText,{color:accent}]}>PLAYER</Text></View>}
      <View style={styles.powerPlate}>
        <Text style={styles.meta}>COMBAT POWER</Text>
        <Text style={[styles.power,{color:accent}]}>{card.power.toLocaleString()}</Text>
      </View>
      <View style={styles.rankPlate}><Text style={styles.meta}>RANK</Text><Text style={styles.rank}>{card.rank}</Text></View>
    </View>

    <View style={[styles.divider,{backgroundColor:accent}]}/>
    <View style={styles.statsGrid}>
      <Info label="LEVEL" value={String(card.level)}/>
      <Info label="RARITY" value={card.rarity}/>
      <Info label="ARCHETYPE" value={card.style.replaceAll('_',' ')}/>
      <Info label="SPECIAL" value={card.subtitle}/>
    </View>
    <Text style={styles.socialHint}>SOCIAL CARD // FACEBOOK · INSTAGRAM · TIKTOK</Text>
    <Action label="UDOSTĘPNIJ KARTĘ →" onPress={()=>{void queueTelemetry({event_type:'CARD_SHARE',event_properties:{rarity:card.rarity,level:card.level}}).then(()=>Share.share({title:'SYSTEM CARD',message:card.shareCaption}))}}/>
  </Animated.View>;
}
function Info({label,value}:{label:string;value:string}){return <View style={styles.info}><Text style={styles.label}>{label}</Text><Text numberOfLines={2} style={styles.value}>{value}</Text></View>}

const styles=StyleSheet.create({
  card:{marginTop:16,padding:18,borderRadius:26,borderWidth:1.5,backgroundColor:'rgba(2,7,11,.95)',shadowOpacity:.38,shadowRadius:22,overflow:'hidden'},
  frameLine:{position:'absolute',inset:7,borderWidth:1,borderRadius:20},
  top:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',gap:12},
  titleWrap:{flex:1,minWidth:0},kicker:{fontSize:9,fontWeight:'900',letterSpacing:1.4},
  heroName:{fontSize:11,lineHeight:15,fontWeight:'900',letterSpacing:2.1,marginTop:8},
  title:{color:'#fff',fontSize:21,lineHeight:26,fontWeight:'900',marginTop:5},
  evolution:{color:'#718791',fontSize:8,fontWeight:'900',letterSpacing:1.5,marginTop:5},
  rarity:{borderWidth:1,borderRadius:10,paddingHorizontal:10,paddingVertical:7,shadowOpacity:.65,shadowRadius:12},
  rarityText:{fontSize:10,fontWeight:'900'},
  hero:{height:250,marginTop:14,alignItems:'center',justifyContent:'center',overflow:'hidden'},
  auraOuter:{position:'absolute',width:205,height:205,borderRadius:103,borderWidth:1.5,transform:[{rotate:'45deg'}],opacity:.42},
  auraInner:{position:'absolute',width:158,height:158,borderRadius:79,borderWidth:1,transform:[{rotate:'-18deg'}],opacity:.58},
  runeOne:{position:'absolute',width:112,height:112,borderWidth:1,transform:[{rotate:'45deg'}],opacity:.22},
  runeTwo:{position:'absolute',width:76,height:76,borderWidth:1,transform:[{rotate:'22deg'}],opacity:.18},
  avatar:{width:136,height:136,borderRadius:68,borderWidth:2},
  placeholder:{alignItems:'center',justifyContent:'center',backgroundColor:'#071219'},
  placeholderText:{fontSize:12,fontWeight:'900',letterSpacing:2},
  powerPlate:{position:'absolute',right:0,bottom:8,alignItems:'flex-end'},
  rankPlate:{position:'absolute',left:0,bottom:8},
  meta:{color:'#7f959f',fontSize:8,fontWeight:'900',letterSpacing:1.2},
  power:{fontSize:25,fontWeight:'900',marginTop:2},rank:{color:'#fff',fontSize:24,fontWeight:'900',marginTop:2},
  divider:{height:1,opacity:.35,marginVertical:12},
  statsGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},
  info:{width:'48%',padding:11,borderRadius:12,backgroundColor:'rgba(255,255,255,.025)',borderWidth:1,borderColor:'rgba(120,180,200,.12)'},
  label:{color:'#657b85',fontSize:8,fontWeight:'900',letterSpacing:1},value:{color:'#e9fbff',fontSize:10,lineHeight:14,fontWeight:'900',marginTop:4},
  socialHint:{color:'#5f7782',fontSize:8,fontWeight:'900',letterSpacing:1.15,textAlign:'center',marginTop:15,marginBottom:2},
});
