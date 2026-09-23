import {useEffect,useMemo,useState} from 'react';
import {StyleSheet,Text,View} from 'react-native';
import Animated,{FadeIn,FadeOut,ZoomIn,ZoomOut} from 'react-native-reanimated';
import SystemAmbientBackground from './SystemAmbientBackground';
import {launchBeats,launchDuration,launchVariant,type LaunchVariant} from '../launch/engine';
import {playAudioTheme,playFeedback,stopAudioTheme} from '../identity/audio';
import type {PlayerProfile} from '../core/types';

export default function SystemBootSequence({
  visible,onComplete,player,firstRun=false,variant,
}:{
  visible:boolean;onComplete?:()=>void;player?:PlayerProfile|null;firstRun?:boolean;variant?:LaunchVariant;
}){
  const resolved=variant??launchVariant(player,firstRun);
  const beats=useMemo(()=>launchBeats(resolved),[resolved]);
  const [beat,setBeat]=useState(0);

  useEffect(()=>{
    if(!visible)return;
    setBeat(0);
    playAudioTheme(resolved==='FIRST_AWAKENING'?'AWAKENING':'HOME');
    playFeedback('SCAN');
    const timers=beats.slice(1).map((item,index)=>setTimeout(()=>{
      setBeat(index+1);
      if(item.impact==='HIGH')playFeedback('PORTAL');
      else if(item.impact==='MEDIUM')playFeedback('SCAN');
    },item.at));
    const end=setTimeout(()=>{stopAudioTheme();onComplete?.()},launchDuration(resolved));
    return()=>{timers.forEach(clearTimeout);clearTimeout(end);stopAudioTheme()};
  },[visible,resolved,beats,onComplete]);

  if(!visible)return null;
  const current=beats[Math.min(beat,beats.length-1)];
  const text=current?.text??'SYSTEM ONLINE';
  const threat=resolved==='ASCENDED'?3:resolved==='VETERAN'?2:1;
  const progress=(beat+1)/Math.max(1,beats.length);

  return <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(380)} pointerEvents="none" style={styles.root}>
    <SystemAmbientBackground intensity="hero" screen="LAUNCH" level={player?.realLevel??1} threat={threat} scene={current?.phase==='AWAKENING'?'PORTAL':undefined}/>
    <View style={styles.vignette}/>
    <View style={styles.scanFrame}><View style={[styles.scanProgress,{width:`${Math.round(progress*100)}%`}]} /></View>
    <Animated.View entering={ZoomIn.duration(650)} exiting={ZoomOut.duration(280)} style={[styles.logoOuter,resolved==='ASCENDED'&&styles.logoAscended]}>
      <View style={styles.logoInner}><View style={styles.logoCore}/></View>
    </Animated.View>
    <Animated.Text key={text} entering={FadeIn.duration(360)} exiting={FadeOut.duration(160)} style={styles.signal}>{text}</Animated.Text>
    <Text style={styles.system}>SYSTEM</Text>
    <Text style={styles.meta}>{resolved.replaceAll('_',' ')} // {player?'LV.'+player.realLevel+' · RANK '+player.rank:'ORIGIN SIGNAL'}</Text>
  </Animated.View>;
}

const styles=StyleSheet.create({
  root:{...StyleSheet.absoluteFill,backgroundColor:'#010305',alignItems:'center',justifyContent:'center',zIndex:1000,overflow:'hidden'},
  vignette:{...StyleSheet.absoluteFill,backgroundColor:'rgba(0,0,0,.24)'},
  scanFrame:{position:'absolute',top:72,left:32,right:32,height:2,backgroundColor:'rgba(108,238,255,.12)',overflow:'hidden'},
  scanProgress:{height:'100%',backgroundColor:'#6ceeff'},
  logoOuter:{width:126,height:126,borderWidth:2,borderColor:'#6ceeff',transform:[{rotate:'45deg'}],alignItems:'center',justifyContent:'center',shadowColor:'#00e5ff',shadowOpacity:.8,shadowRadius:32},
  logoAscended:{width:144,height:144,borderColor:'#fff',shadowRadius:42},
  logoInner:{width:54,height:54,borderWidth:2,borderColor:'#fff',backgroundColor:'rgba(0,229,255,.10)',alignItems:'center',justifyContent:'center'},
  logoCore:{width:16,height:16,borderRadius:8,backgroundColor:'#6ceeff',shadowColor:'#6ceeff',shadowOpacity:1,shadowRadius:16},
  signal:{color:'#f3fdff',fontWeight:'900',fontSize:16,letterSpacing:3.4,marginTop:58,textAlign:'center'},
  system:{color:'#6ceeff',fontWeight:'900',fontSize:30,letterSpacing:9,marginTop:14},
  meta:{color:'#6f8791',fontSize:9,fontWeight:'900',letterSpacing:1.8,marginTop:12},
});
