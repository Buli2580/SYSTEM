import { useCallback, useState } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { ART } from '../visual/assets';
import { worldPresentation, WorldEvent } from './model';

export function SceneArt({source,fit='cover'}:{source:number;fit?:'cover'|'contain'}) {
 const [failed,setFailed]=useState<number>();
 return failed === source ? <View style={[StyleSheet.absoluteFill,{backgroundColor:'#09151e'}]} /> :
  <Image source={source} contentFit={fit} transition={0} cachePolicy="none" onError={()=>setFailed(source)} style={StyleSheet.absoluteFill} />;
}
export default function WorldStage({presentation:p,event,foreground}:{presentation:ReturnType<typeof worldPresentation>;event:WorldEvent;foreground:boolean}) {
 const entrance=useSharedValue(1);
 useFocusEffect(useCallback(()=>{
  cancelAnimation(entrance);
  entrance.value=1;
  if(p.animate && foreground){entrance.value=0;entrance.value=withTiming(1,{duration:1400});}
  return ()=>cancelAnimation(entrance);
 },[entrance,p.animate,foreground,event]));
 const far=useAnimatedStyle(()=>({transform:[{translateX:(1-entrance.value)*p.parallax}]}));
 const near=useAnimatedStyle(()=>({transform:[{translateX:-(1-entrance.value)*p.parallax},{translateY:(1-entrance.value)*8}]}));
 return <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
  <Animated.View testID="world-background" style={[s.background,far]}><SceneArt source={ART.home}/></Animated.View>
  <View testID="world-lighting" style={[StyleSheet.absoluteFill,{backgroundColor:p.night?'rgba(1,6,18,.36)':'rgba(40,28,16,.12)'}]} />
  <View style={[StyleSheet.absoluteFill,{backgroundColor:p.boss==='THREAT'?'rgba(100,12,28,.12)':p.tier>=2?'rgba(30,80,100,.10)':'transparent'}]} />
  {p.boss==='THREAT' && <Animated.View testID="world-boss" style={[s.boss,near]}><SceneArt source={ART.boss} fit="contain"/></Animated.View>}
  <View testID="world-fog" style={[s.fog,{opacity:p.night?.22:.1}]} />
  <Animated.View testID="world-weather" style={[StyleSheet.absoluteFill,near]}>
   {Array.from({length:p.particles},(_,i)=><View key={i} style={[s.spark,{left:`${12+i*15}%`,top:`${28+(i*13)%44}%`,backgroundColor:p.weather==='ASH'?'#dca775':'#7ccad9'}]}/>)}
  </Animated.View>
  {event==='VICTORY' && <View testID="world-victory" style={[StyleSheet.absoluteFill,{backgroundColor:'rgba(255,200,90,.10)'}]}/>}
  <View style={s.topVeil}/><View style={s.bottomVeil}/>
 </View>;
}
const s=StyleSheet.create({background:{position:'absolute',top:0,bottom:0,left:-8,right:-8},boss:{position:'absolute',right:8,top:'20%',width:'30%',height:'25%',opacity:.55},fog:{position:'absolute',left:-30,right:-30,top:'48%',height:120,borderRadius:70,backgroundColor:'#86a8ba'},spark:{position:'absolute',width:2,height:4,opacity:.45},topVeil:{position:'absolute',left:0,right:0,top:0,height:140,backgroundColor:'rgba(1,6,10,.48)'},bottomVeil:{position:'absolute',left:0,right:0,bottom:0,height:250,backgroundColor:'rgba(1,6,10,.68)'}});
