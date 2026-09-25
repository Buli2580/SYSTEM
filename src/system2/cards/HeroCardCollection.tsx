import {StyleSheet,Text,View} from 'react-native';
import Animated,{FadeInUp} from 'react-native-reanimated';
import type {PlayerProfile} from '../core/types';
import {HERO_CARD_COLLECTION,heroCardNameForLevel} from './engine';

export default function HeroCardCollection({player}:{player:PlayerProfile}){
  const current=heroCardNameForLevel(player.realLevel);
  return <Animated.View entering={FadeInUp.duration(380)} style={styles.root}>
    <View style={styles.header}>
      <View>
        <Text style={styles.code}>HERO CARD COLLECTION // 9 EVOLUTIONS</Text>
        <Text style={styles.title}>TWOJA TALIA SYSTEMU</Text>
      </View>
      <Text style={styles.count}>{HERO_CARD_COLLECTION.filter(card=>player.realLevel>=card.level).length}/9</Text>
    </View>
    <Text style={styles.body}>Karty odblokowują się wyłącznie przez REAL LEVEL. Nie dają XP ani przewagi — pokazują progres i status postaci.</Text>
    <View style={styles.grid}>
      {HERO_CARD_COLLECTION.map(card=>{
        const unlocked=player.realLevel>=card.level;
        const active=card.name===current;
        return <View key={card.name} style={[styles.card,unlocked&&styles.cardUnlocked,active&&styles.cardActive]}>
          <Text style={[styles.level,unlocked&&styles.levelUnlocked]}>LV.{card.level}</Text>
          <Text numberOfLines={2} style={[styles.name,unlocked&&styles.nameUnlocked]}>{unlocked?card.name:'SEALED'}</Text>
          <Text numberOfLines={2} style={styles.tag}>{unlocked?card.tagline:'LOCKED EVOLUTION'}</Text>
          {active&&<Text style={styles.active}>CURRENT</Text>}
        </View>;
      })}
    </View>
  </Animated.View>;
}

const styles=StyleSheet.create({
  root:{marginTop:16,padding:18,borderWidth:1,borderColor:'rgba(108,238,255,.24)',borderRadius:24,backgroundColor:'rgba(2,8,12,.94)'},
  header:{flexDirection:'row',justifyContent:'space-between',gap:12,alignItems:'flex-start'},
  code:{color:'#6ceeff',fontSize:8,fontWeight:'900',letterSpacing:1.35},
  title:{color:'#fff',fontSize:21,lineHeight:27,fontWeight:'900',marginTop:6},
  count:{color:'#ffd36c',fontSize:18,fontWeight:'900'},
  body:{color:'#78909a',fontSize:10,lineHeight:16,marginTop:10},
  grid:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:14},
  card:{width:'31%',flexGrow:1,minHeight:94,padding:10,borderWidth:1,borderColor:'rgba(110,135,145,.16)',borderRadius:13,backgroundColor:'rgba(255,255,255,.018)'},
  cardUnlocked:{borderColor:'rgba(108,238,255,.34)',backgroundColor:'rgba(0,229,255,.035)'},
  cardActive:{borderColor:'#ffd36c',backgroundColor:'rgba(255,211,108,.055)'},
  level:{color:'#51646d',fontSize:7,fontWeight:'900',letterSpacing:.9},
  levelUnlocked:{color:'#6ceeff'},
  name:{color:'#4c5a60',fontSize:10,lineHeight:14,fontWeight:'900',marginTop:5},
  nameUnlocked:{color:'#fff'},
  tag:{color:'#617780',fontSize:7,lineHeight:10,fontWeight:'800',marginTop:4},
  active:{color:'#ffd36c',fontSize:7,fontWeight:'900',letterSpacing:1,marginTop:7},
});
