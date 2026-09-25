import {useEffect} from 'react';
import {StyleSheet,View} from 'react-native';
import Animated,{cancelAnimation,Easing,interpolate,useAnimatedStyle,useSharedValue,withRepeat,withTiming} from 'react-native-reanimated';
import type {MotionIntensity} from '../presentation/animationEngine4';
import {useAnimationEngine4} from './AnimationEngine4Provider';

export default function SystemMotionLayer({intensity='default'}:{intensity?:MotionIntensity}){
 const engine=useAnimationEngine4(),profile=engine.profile(intensity);
 const scan=useSharedValue(0),pulse=useSharedValue(0);
 useEffect(()=>{
  if(engine.reducedMotion)return;
  scan.value=withRepeat(withTiming(1,{duration:profile.scanDuration,easing:Easing.linear}),-1,false);
  pulse.value=withRepeat(withTiming(1,{duration:profile.ambientPulseMs,easing:Easing.inOut(Easing.ease)}),-1,true);
  return()=>{cancelAnimation(scan);cancelAnimation(pulse)};
 },[engine.reducedMotion,profile.scanDuration,profile.ambientPulseMs,scan,pulse]);
 const scanStyle=useAnimatedStyle(()=>({
  opacity:profile.scanOpacity*interpolate(scan.value,[0,.15,.82,1],[0,1,.7,0]),
  transform:[{translateY:interpolate(scan.value,[0,1],[-80,900])}],
 }));
 const pulseStyle=useAnimatedStyle(()=>({
  opacity:interpolate(pulse.value,[0,1],[.04,.13]),
  transform:[{scale:interpolate(pulse.value,[0,1],[.96,1.04])}],
 }));
 if(engine.reducedMotion)return null;
 return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
  <Animated.View style={[styles.edge,pulseStyle]}/>
  <Animated.View style={[styles.scan,scanStyle]}/>
 </View>;
}
const styles=StyleSheet.create({
 edge:{position:'absolute',left:-40,right:-40,top:-80,height:260,borderRadius:180,borderWidth:1,borderColor:'rgba(108,238,255,.24)'},
 scan:{position:'absolute',left:0,right:0,top:0,height:1,backgroundColor:'#6ceeff',shadowColor:'#6ceeff',shadowOpacity:.8,shadowRadius:9},
});
