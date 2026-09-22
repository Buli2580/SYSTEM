import {useEffect,useMemo,useState} from 'react';
import {StyleSheet,Text,View} from 'react-native';
import Animated,{FadeIn,FadeOut,ZoomIn} from 'react-native-reanimated';
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
  const text=beats[Math.min(beat,beats.length-1)]?.text??'SYSTEM ONLINE';
  const threat=resolved==='ASCENDED'?3:resolved==='VETERAN'?2:1;

  return <View pointerEvents="none" style={styles.root}>
    <SystemAmbientBackground intensity="hero" screen="LAUNCH" level={player?.realLevel??1} threat={threat}/>
    <View style={styles.vignette}/>
    <Animated.View entering={ZoomIn.duration(600)} style={styles.logoOuter}>
      <View style={styles.logoInner}/>
    </Animated.View>
    <Animated.Text key={text} entering={FadeIn.duration(350)} exiting={FadeOut.duration(180)} style={styles.signal}>{text}</Animated.Text>
    <Text style={styles.system}>SYSTEM</Text>
    <Text style={styles.meta}>{resolved.replaceAll('_',' ')} // {player?'LV.'+player.realLevel+' · RANK '+player.rank:'ORIGIN SIGNAL'}</Text>
  </View>;
}

const styles=StyleSheet.create({
  root:{...StyleSheet.absoluteFillObject,backgroundColor:'#010305',alignItems:'center',justifyContent:'center',zIndex:1000,overflow:'hidden'},
  vignette:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(0,0,0,.28)'},
  logoOuter:{width:118,height:118,borderWidth:2,borderColor:'#6ceeff',transform:[{rotate:'45deg'}],alignItems:'center',justifyContent:'center',shadowColor:'#00e5ff',shadowOpacity:.75,shadowRadius:28},
  logoInner:{width:46,height:46,borderWidth:2,borderColor:'#fff',backgroundColor:'rgba(0,229,255,.12)'},
  signal:{color:'#eafcff',fontWeight:'900',fontSize:15,letterSpacing:3.5,marginTop:54,textAlign:'center'},
  system:{color:'#6ceeff',fontWeight:'900',fontSize:28,letterSpacing:8,marginTop:14},
  meta:{color:'#66838e',fontSize:9,fontWeight:'900',letterSpacing:1.8,marginTop:12},
});
