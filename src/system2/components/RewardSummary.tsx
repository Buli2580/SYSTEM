import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import type { RewardReceipt } from '../core/rewards';
import { SYSTEM_COLORS as C } from '../core';

export default function RewardSummary({ receipt }: { receipt: RewardReceipt }) {
  const levelUp = receipt.afterLevel > receipt.beforeLevel;
  return <Animated.View entering={FadeInUp.duration(360)} style={[styles.panel, levelUp && styles.levelPanel]} accessibilityLabel="Podsumowanie zapisanej nagrody">
    <View style={styles.header}>
      <View style={styles.headerBody}>
        <Text style={styles.code}>CANONICAL REWARD RECEIPT</Text>
        <Text style={styles.title}>{levelUp ? 'LEVEL UP' : 'XP ZAPISANE'}</Text>
      </View>
      <View style={styles.verified}><Text style={styles.verifiedText}>VERIFIED</Text></View>
    </View>

    <View style={styles.primaryReward}>
      <Text style={styles.xp}>+{receipt.realXp}</Text>
      <Text style={styles.xpUnit}>REAL XP</Text>
    </View>

    <View style={styles.rewardGrid}>
      <View style={styles.rewardCell}><Text style={styles.meta}>ENERGY</Text><Text style={styles.value}>+{receipt.energy}</Text></View>
      <View style={styles.rewardCell}><Text style={styles.meta}>DISTANCE</Text><Text style={styles.value}>{receipt.distanceMeters > 0 ? Math.round(receipt.distanceMeters) + ' M' : '—'}</Text></View>
      <View style={styles.rewardCell}><Text style={styles.meta}>REAL LEVEL</Text><Text style={styles.value}>{receipt.beforeLevel} → {receipt.afterLevel}</Text></View>
    </View>

    {!!Object.keys(receipt.skillXp).length && <View style={styles.section}>
      <Text style={styles.meta}>SKILL XP</Text>
      <View style={styles.chips}>
        {Object.entries(receipt.skillXp).map(([skill, xp]) => <View key={skill} style={styles.chip}><Text style={styles.chipText}>+{xp} {skill}</Text></View>)}
      </View>
    </View>}

    {!!receipt.skillLevels.length && <View style={styles.section}>
      <Text style={styles.meta}>SKILL LEVEL UP</Text>
      {receipt.skillLevels.map(skill => <Text key={skill.key} style={styles.detail}>{skill.key} LV.{skill.before} → LV.{skill.after}</Text>)}
    </View>}

    {!!receipt.newTitles.length && <Text style={styles.unlock}>TITLE UNLOCKED // {receipt.newTitles.join(' · ')}</Text>}
    {receipt.worldUnlocked && <Text style={styles.unlock}>WORLD UNLOCKED // SYSTEM WORLD ONLINE</Text>}
  </Animated.View>;
}

const styles=StyleSheet.create({
  panel:{marginTop:16,padding:20,borderWidth:1,borderColor:C.success,borderRadius:22,backgroundColor:'rgba(5,24,19,0.94)'},
  levelPanel:{borderColor:C.legendary,backgroundColor:'rgba(35,26,10,0.84)'},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:12},
  headerBody:{flex:1,minWidth:0},
  code:{color:C.success,fontSize:8,fontWeight:'900',letterSpacing:1.5},
  title:{color:C.white,fontSize:22,lineHeight:28,fontWeight:'900',marginTop:5,flexShrink:1},
  verified:{borderWidth:1,borderColor:C.success,borderRadius:999,paddingHorizontal:10,paddingVertical:6},
  verifiedText:{color:C.success,fontSize:8,fontWeight:'900',letterSpacing:1},
  primaryReward:{flexDirection:'row',alignItems:'flex-end',gap:8,marginTop:18},
  xp:{color:C.white,fontSize:46,lineHeight:50,fontWeight:'900'},
  xpUnit:{color:C.cyan,fontSize:12,fontWeight:'900',marginBottom:7,letterSpacing:1.2},
  rewardGrid:{flexDirection:'row',gap:8,marginTop:14},
  rewardCell:{flex:1,minWidth:0,padding:11,borderWidth:1,borderColor:C.line,borderRadius:13,backgroundColor:C.panel},
  meta:{color:C.textVeryMuted,fontSize:7,fontWeight:'900',letterSpacing:1.2},
  value:{color:C.white,fontSize:13,lineHeight:18,fontWeight:'900',marginTop:5,flexShrink:1},
  section:{marginTop:15,paddingTop:13,borderTopWidth:1,borderTopColor:C.line},
  chips:{flexDirection:'row',flexWrap:'wrap',gap:7,marginTop:8},
  chip:{paddingHorizontal:9,paddingVertical:6,borderRadius:999,borderWidth:1,borderColor:C.cyanDark},
  chipText:{color:C.cyan,fontSize:8,fontWeight:'900'},
  detail:{color:C.text,fontSize:10,fontWeight:'900',marginTop:7},
  unlock:{color:C.legendary,fontSize:10,lineHeight:16,fontWeight:'900',letterSpacing:0.65,marginTop:14,flexShrink:1},
});
