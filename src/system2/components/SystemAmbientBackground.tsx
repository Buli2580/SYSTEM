import { useFocusEffect } from 'expo-router';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { SYSTEM_COLORS as C } from '../core';
import { chooseScene } from '../visual/engine';
import type { ScreenMood, ThreatLevel, WorldSceneId, WorldWeather } from '../visual/types';

type Intensity = 'quiet' | 'default' | 'hero' | 'world';

export default function SystemAmbientBackground({
  intensity='default', screen='HOME', level=1, threat=0, scene, weather='CLEAR',
}:{
  intensity?:Intensity;
  screen?:ScreenMood;
  level?:number;
  threat?:ThreatLevel;
  scene?:WorldSceneId;
  weather?:WorldWeather;
}) {
  const drift=useSharedValue(0);
  const scan=useSharedValue(0);
  const pulse=useSharedValue(0);
  const worldScene=chooseScene({screen,level,threat,scene,weather});

  useFocusEffect(useCallback(()=>{
    drift.value=withRepeat(withTiming(1,{duration:14000,easing:Easing.inOut(Easing.ease)}),-1,true);
    scan.value=withRepeat(withTiming(1,{duration:9000,easing:Easing.linear}),-1,false);
    pulse.value=withRepeat(withTiming(1,{duration:3200,easing:Easing.inOut(Easing.ease)}),-1,true);
    return()=>{cancelAnimation(drift);cancelAnimation(scan);cancelAnimation(pulse)};
  },[drift,scan,pulse]));

  const driftStyle=useAnimatedStyle(()=>({transform:[
    {translateX:interpolate(drift.value,[0,1],[-8,14])},
    {translateY:interpolate(drift.value,[0,1],[8,-10])},
    {scale:interpolate(drift.value,[0,1],[1,1.035])},
  ]}));
  const scanStyle=useAnimatedStyle(()=>({
    transform:[{translateY:interpolate(scan.value,[0,1],[-420,700])}],
    opacity:interpolate(scan.value,[0,.5,1],[0,.18,0]),
  }));
  const pulseStyle=useAnimatedStyle(()=>({
    opacity:interpolate(pulse.value,[0,1],[.16,.5]),
    transform:[{scale:interpolate(pulse.value,[0,1],[.92,1.08])}],
  }));

  const strength=intensity==='hero'?1:intensity==='world'?.92:intensity==='quiet'?.52:.74;
  const nightOverlay=weather==='STORM'?.22:weather==='RAIN'?.16:weather==='FOG'?.12:.08;

  return <View pointerEvents="none" style={styles.root}>
    <View style={[StyleSheet.absoluteFill,{backgroundColor:worldScene.secondary,opacity:.28*strength}]} />
    <Animated.View style={[styles.horizon,{borderColor:worldScene.accent,opacity:.20*strength},driftStyle]} />
    <Animated.View style={[styles.portal,{borderColor:worldScene.accent,shadowColor:worldScene.accent},pulseStyle]} />
    <Silhouette type={worldScene.silhouettes} accent={worldScene.accent} strength={strength} />
    <Particles kind={worldScene.particle} accent={worldScene.accent} strength={strength} />
    <Animated.View style={[styles.energyArc,{borderColor:worldScene.accent,opacity:.18*strength},driftStyle]} />
    <Animated.View style={[styles.scanLine,{backgroundColor:worldScene.accent},scanStyle]} />
    <View style={[styles.vignette,{backgroundColor:'#000',opacity:nightOverlay}]} />
    {threat>=2&&<Animated.View style={[styles.threatCore,{borderColor:worldScene.accent,shadowColor:worldScene.accent},pulseStyle]} />}
  </View>;
}

function Particles({kind,accent,strength}:{kind:string;accent:string;strength:number}) {
  return <>{Array.from({length:12},(_,i)=><View key={i} style={[
    styles.particle,
    {
      left:(i*37)%100+'%',top:(i*53)%92+'%',
      width:kind==='rain'?1:2+(i%3),height:kind==='rain'?18+(i%4)*7:2+(i%3),
      backgroundColor:accent,opacity:(.06+(i%4)*.025)*strength,
      transform:[{rotate:kind==='rain'?'-18deg':(i*17)+'deg'}],
    }
  ]}/>)}</>;
}

function Silhouette({type,accent,strength}:{type:string;accent:string;strength:number}) {
  if(type==='boss') return <View style={[styles.bossWrap,{opacity:.30*strength}]}>
    <View style={[styles.bossHead,{borderColor:accent}]} />
    <View style={[styles.bossShoulder,{borderColor:accent}]} />
    <View style={[styles.bossEye,{backgroundColor:accent,shadowColor:accent}]} />
  </View>;
  if(type==='trees') return <View style={styles.skyline}>{[0,1,2,3,4,5].map(i=><View key={i} style={[styles.tree,{left:i*19+'%',height:80+(i%3)*45,borderColor:accent,opacity:.10*strength}]}/>)}</View>;
  if(type==='factory') return <View style={styles.skyline}>{[0,1,2,3].map(i=><View key={i} style={[styles.factory,{left:i*27+'%',height:58+i*16,borderColor:accent,opacity:.12*strength}]}/>)}</View>;
  if(type==='portal') return <View style={[styles.portalSpire,{borderColor:accent,opacity:.18*strength}]} />;
  return <View style={styles.skyline}>{[0,1,2,3,4,5].map(i=><View key={i} style={[styles.building,{left:i*18+'%',height:45+(i%4)*28,borderColor:accent,opacity:.10*strength}]}/>)}</View>;
}

const styles=StyleSheet.create({
  root:{...StyleSheet.absoluteFill,overflow:'hidden',backgroundColor:'#020609'},
  horizon:{position:'absolute',width:'130%',height:270,borderWidth:1,borderRadius:180,bottom:-160,left:'-15%'},
  portal:{position:'absolute',width:250,height:250,borderRadius:125,borderWidth:1.5,top:'18%',right:-110,shadowOpacity:.45,shadowRadius:24},
  portalSpire:{position:'absolute',width:120,height:300,borderWidth:1,borderRadius:60,top:'22%',left:'50%',marginLeft:-60,transform:[{rotate:'18deg'}]},
  energyArc:{position:'absolute',width:420,height:420,borderRadius:210,borderWidth:1,top:'34%',left:-220},
  scanLine:{position:'absolute',height:1,width:'130%',left:'-15%',top:'20%',opacity:.22},
  vignette:{...StyleSheet.absoluteFill},
  particle:{position:'absolute',borderRadius:4},
  skyline:{position:'absolute',left:0,right:0,bottom:0,height:'42%'},
  building:{position:'absolute',bottom:0,width:'22%',borderWidth:1,borderBottomWidth:0,borderTopLeftRadius:4,borderTopRightRadius:4},
  factory:{position:'absolute',bottom:0,width:'24%',borderWidth:1,borderBottomWidth:0},
  tree:{position:'absolute',bottom:-30,width:0,borderLeftWidth:28,borderRightWidth:28,borderTopWidth:0,borderBottomWidth:100,borderLeftColor:'transparent',borderRightColor:'transparent',backgroundColor:'transparent'},
  bossWrap:{position:'absolute',right:-36,bottom:18,width:220,height:330},
  bossHead:{position:'absolute',width:115,height:130,borderRadius:52,borderWidth:2,top:15,right:28,transform:[{rotate:'-8deg'}]},
  bossShoulder:{position:'absolute',width:220,height:150,borderRadius:90,borderWidth:2,bottom:20,right:-10,transform:[{rotate:'8deg'}]},
  bossEye:{position:'absolute',width:10,height:4,borderRadius:4,top:73,right:88,shadowOpacity:1,shadowRadius:9},
  threatCore:{position:'absolute',width:82,height:82,borderRadius:41,borderWidth:1.5,top:'42%',left:'50%',marginLeft:-41,shadowOpacity:.75,shadowRadius:18},
});
