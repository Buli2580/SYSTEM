import {Pressable,StyleSheet,Text,View} from 'react-native';
import Animated,{FadeIn,FadeInUp} from 'react-native-reanimated';
import SystemAmbientBackground from '../components/SystemAmbientBackground';
import SystemPlayerCard from './SystemPlayerCard';
import type {PlayerProfile} from '../core/types';
import type {CardReason} from './engine';
import {useAnimationEngine4} from '../components/AnimationEngine4Provider';

export default function MilestoneCardOverlay({player,reason,onDismiss}:{player:PlayerProfile;reason:CardReason;onDismiss:()=>void}){
  const motion=useAnimationEngine4();
  return <Animated.View entering={motion.reducedMotion?undefined:FadeIn.duration(motion.duration('fast'))} style={styles.root}>
    <SystemAmbientBackground intensity="hero" screen={reason==='BOSS'?'BOSS':'CHARACTER'} scene={reason==='BOSS'?'BOSS_ZONE':'PORTAL'} threat={reason==='BOSS'?3:2} level={player.realLevel}/>
    <View style={styles.scrim}/>
    <Animated.View entering={motion.reducedMotion?undefined:FadeInUp.duration(motion.duration('hero'))} style={styles.content}>
      <Text style={styles.kicker}>SYSTEM // SPECIAL CARD UNLOCKED</Text>
      <Text style={styles.heading}>{reason.replaceAll('_',' ')}</Text>
      <SystemPlayerCard player={player} reason={reason}/>
      <Pressable accessibilityRole="button" accessibilityLabel="Kontynuuj" onPress={onDismiss} style={styles.continue}>
        <Text style={styles.continueText}>KONTYNUUJ →</Text>
      </Pressable>
    </Animated.View>
  </Animated.View>;
}
const styles=StyleSheet.create({
  root:{...StyleSheet.absoluteFill,zIndex:980,backgroundColor:'#010406'},
  scrim:{...StyleSheet.absoluteFill,backgroundColor:'rgba(0,0,0,.36)'},
  content:{flex:1,justifyContent:'center',padding:22},
  kicker:{color:'#6ceeff',fontSize:9,fontWeight:'900',letterSpacing:2,textAlign:'center'},
  heading:{color:'#fff',fontSize:26,fontWeight:'900',letterSpacing:1.5,textAlign:'center',marginTop:8},
  continue:{marginTop:14,minHeight:52,borderRadius:14,borderWidth:1,borderColor:'#6ceeff',alignItems:'center',justifyContent:'center',backgroundColor:'rgba(0,229,255,.08)'},
  continueText:{color:'#6ceeff',fontSize:11,fontWeight:'900',letterSpacing:1.5},
});
