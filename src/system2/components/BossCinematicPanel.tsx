import {useEffect} from 'react';
import {StyleSheet,Text,View,type DimensionValue} from 'react-native';
import {VideoView,useVideoPlayer} from 'expo-video';
import Animated,{FadeIn,FadeInUp} from 'react-native-reanimated';
import {bossPhaseState} from '../story/bossEngine';
import {SYSTEM_COLORS as C} from '../core';

export default function BossCinematicPanel({
  hp=100,
  startedAt,
}:{hp?:number;startedAt?:string}){
  const phase=bossPhaseState(hp,100,Date.now(),startedAt);
  const player=useVideoPlayer(require('../../../assets/video/boss_intro.mp4'),p=>{
    p.loop=true;
    p.muted=true;
    p.play();
  });
  useEffect(()=>()=>{try{player.pause()}catch{}},[player]);
  const hpPercent=Math.max(0,Math.min(100,phase.hp));
  const broken=100-hpPercent;

  return <Animated.View entering={FadeIn.duration(260)} style={styles.root}>
    <VideoView player={player} nativeControls={false} contentFit="cover" style={StyleSheet.absoluteFill}/>
    <View style={styles.scrim}/>
    <View style={styles.top}>
      <Text style={styles.code}>BOSS CINEMATIC // LIVE ENCOUNTER</Text>
      <View style={styles.threat}><Text style={styles.threatText}>THREAT 03</Text></View>
    </View>
    <Animated.View entering={FadeInUp.duration(420)} style={styles.body}>
      <Text style={styles.phase}>{phase.label}</Text>
      <Text style={styles.name}>THE FIRST WALL</Text>
      <Text style={styles.meta}>WEAK POINT // {phase.weakPoint}{phase.enrage?' · ENRAGE':''}</Text>
      <View style={styles.hpTrack}><View style={[styles.hpFill,{width:`${hpPercent}%` as DimensionValue}]} /></View>
      <View style={styles.hpRow}>
        <Text style={styles.hp}>{phase.hp} / {phase.maxHp} HP</Text>
        <Text style={styles.damage}>{broken}% PRZEŁAMANIA</Text>
      </View>
      {phase.finisherReady&&<Text style={styles.finisher}>FINAL STRIKE READY</Text>}
    </Animated.View>
  </Animated.View>;
}

const styles=StyleSheet.create({
  root:{height:310,marginTop:16,borderRadius:24,overflow:'hidden',borderWidth:1,borderColor:'rgba(228,186,255,.46)',backgroundColor:'#050208'},
  scrim:{...StyleSheet.absoluteFill,backgroundColor:'rgba(3,1,7,.58)'},
  top:{position:'absolute',top:16,left:16,right:16,flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:10},
  code:{flex:1,color:'#e4baff',fontSize:8,fontWeight:'900',letterSpacing:1.35},
  threat:{borderWidth:1,borderColor:'#ff6f91',borderRadius:999,paddingHorizontal:10,paddingVertical:6,backgroundColor:'rgba(255,70,110,.08)'},
  threatText:{color:'#ff9aad',fontSize:8,fontWeight:'900',letterSpacing:1},
  body:{position:'absolute',left:16,right:16,bottom:16,padding:16,borderRadius:18,borderWidth:1,borderColor:'rgba(228,186,255,.32)',backgroundColor:'rgba(5,2,9,.78)'},
  phase:{color:'#ffd36c',fontSize:9,fontWeight:'900',letterSpacing:1.4},
  name:{color:C.white,fontSize:25,lineHeight:30,fontWeight:'900',marginTop:5},
  meta:{color:'#c7b0d0',fontSize:9,fontWeight:'900',letterSpacing:.9,marginTop:7},
  hpTrack:{height:9,borderRadius:99,overflow:'hidden',backgroundColor:'#241326',marginTop:14,borderWidth:1,borderColor:'rgba(228,186,255,.18)'},
  hpFill:{height:'100%',backgroundColor:'#e4baff'},
  hpRow:{flexDirection:'row',justifyContent:'space-between',gap:10,marginTop:8},
  hp:{color:'#fff',fontSize:10,fontWeight:'900'},
  damage:{color:'#8da5af',fontSize:8,fontWeight:'900'},
  finisher:{color:'#ffd36c',fontSize:11,fontWeight:'900',letterSpacing:1.6,textAlign:'center',marginTop:12},
});
