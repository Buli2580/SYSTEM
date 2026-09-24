import {useEffect,useMemo,useState} from 'react';
import {Modal,Pressable,StyleSheet,Text,View} from 'react-native';
import Animated,{FadeIn,FadeInUp,ZoomIn} from 'react-native-reanimated';
import type {RewardReceipt} from '../core/rewards';
import {bossPhaseState} from '../story/bossEngine';
import {combatSequence} from '../presentation/combat';
import SystemAmbientBackground from './SystemAmbientBackground';
import {playFeedback} from '../identity/audio';
import {useAnimationEngine4} from './AnimationEngine4Provider';

export default function CombatImpactOverlay({
  damage,onDismiss,
}:{
  damage:NonNullable<RewardReceipt['bossDamage']>;
  onDismiss:()=>void;
}){
  const motion=useAnimationEngine4();
  const before=useMemo(()=>bossPhaseState(damage.beforeHp),[damage.beforeHp]);
  const after=useMemo(()=>bossPhaseState(damage.afterHp),[damage.afterHp]);
  const beats=useMemo(()=>combatSequence(before,after,damage.dealt),[before,after,damage.dealt]);
  const [index,setIndex]=useState(0);
  useEffect(()=>{
    playFeedback('BOSS_HIT');
    const timers=motion.reducedMotion?[]:beats.slice(1).map((beat,i)=>setTimeout(()=>setIndex(i+1),beat.at));
    if(motion.reducedMotion)setIndex(Math.max(0,beats.length-1));
    const total=motion.reducedMotion?850:Math.max(...beats.map(b=>b.at+b.duration),2600);
    const end=setTimeout(onDismiss,total);
    return()=>{timers.forEach(clearTimeout);clearTimeout(end)};
  },[beats,onDismiss,motion.reducedMotion]);
  const beat=beats[Math.min(index,beats.length-1)];
  const progress=Math.max(0,Math.min(1,damage.afterHp/Math.max(1,before.maxHp)));
  const phaseChanged=damage.phaseBefore!==damage.phaseAfter;
  return <Modal transparent animationType="none" onRequestClose={onDismiss}>
    <Pressable accessibilityRole="button" accessibilityLabel="Zamknij sekwencję walki" onPress={onDismiss} style={styles.root}>
      <SystemAmbientBackground intensity="hero" screen="BOSS" scene="BOSS_ZONE" threat={3}/>
      <View style={styles.scrim}/>
      <Animated.View entering={FadeIn.duration(motion.duration('fast'))} style={styles.hud}>
        <Text style={styles.code}>COMBAT VISUALIZER // BOSS 3.0</Text>
        <Text style={styles.phase}>{damage.phaseAfter.replaceAll('_',' ')}</Text>
        <View style={styles.track}><Animated.View entering={FadeIn.duration(motion.duration('hero'))} style={[styles.fill,{width:`${Math.round(progress*100)}%`}]}/></View>
        <View style={styles.hpRow}><Text style={styles.hp}>{damage.afterHp} HP</Text><Text style={styles.hpBefore}>{damage.beforeHp} → {damage.afterHp}</Text></View>
      </Animated.View>
      <Animated.View key={index} entering={beat.kind==='IMPACT'?ZoomIn.duration(motion.duration('micro')):FadeInUp.duration(motion.duration('fast'))} style={styles.impact}>
        <Text style={styles.eyebrow}>{beat.kind.replaceAll('_',' ')}</Text>
        <Text style={styles.damage}>{beat.kind==='DAMAGE_NUMBER'||beat.kind==='IMPACT'?`-${damage.dealt} HP`:beat.label??damage.phaseAfter}</Text>
        {phaseChanged&&<Text style={styles.phaseChange}>PHASE CHANGE // {damage.phaseBefore} → {damage.phaseAfter}</Text>}
      </Animated.View>
      <Text style={styles.skip}>DOTKNIJ, ABY POMINĄĆ</Text>
    </Pressable>
  </Modal>;
}
const styles=StyleSheet.create({
  root:{flex:1,backgroundColor:'#010305',justifyContent:'center',padding:22,overflow:'hidden'},
  scrim:{...StyleSheet.absoluteFill,backgroundColor:'rgba(0,0,0,.5)'},
  hud:{position:'absolute',top:70,left:22,right:22},
  code:{color:'#e4baff',fontSize:9,fontWeight:'900',letterSpacing:1.6},
  phase:{color:'#fff',fontSize:24,lineHeight:30,fontWeight:'900',marginTop:8},
  track:{height:10,borderRadius:10,overflow:'hidden',backgroundColor:'#261627',marginTop:14,borderWidth:1,borderColor:'#e4baff44'},
  fill:{height:'100%',backgroundColor:'#e4baff'},
  hpRow:{flexDirection:'row',justifyContent:'space-between',marginTop:8},
  hp:{color:'#fff',fontSize:13,fontWeight:'900'},
  hpBefore:{color:'#9faeb5',fontSize:10,fontWeight:'900'},
  impact:{alignItems:'center',padding:24,borderWidth:1,borderColor:'#e4baff55',borderRadius:24,backgroundColor:'rgba(10,5,14,.84)'},
  eyebrow:{color:'#e4baff',fontSize:9,fontWeight:'900',letterSpacing:2},
  damage:{color:'#fff',fontSize:48,lineHeight:56,fontWeight:'900',marginTop:10,textAlign:'center'},
  phaseChange:{color:'#ffd36c',fontSize:10,lineHeight:15,fontWeight:'900',letterSpacing:1,marginTop:12,textAlign:'center'},
  skip:{position:'absolute',bottom:48,alignSelf:'center',color:'#6f8791',fontSize:8,fontWeight:'900',letterSpacing:1.3},
});
