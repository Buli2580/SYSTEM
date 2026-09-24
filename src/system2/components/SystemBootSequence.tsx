import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {Pressable,StyleSheet,Text,View} from 'react-native';
import Animated,{cancelAnimation,Easing,FadeIn,FadeOut,ZoomIn,ZoomOut,interpolate,useAnimatedStyle,useSharedValue,withRepeat,withTiming} from 'react-native-reanimated';
import SystemAmbientBackground from './SystemAmbientBackground';
import {launchBeats,launchDuration,launchVariant,type LaunchVariant} from '../launch/engine';
import {playAudioTheme,playFeedback,stopAudioTheme} from '../identity/audio';
import type {PlayerProfile} from '../core/types';
import {useAnimationEngine4} from './AnimationEngine4Provider';

export default function SystemBootSequence({
  visible,onComplete,player,firstRun=false,variant,
}:{
  visible:boolean;onComplete?:()=>void;player?:PlayerProfile|null;firstRun?:boolean;variant?:LaunchVariant;
}){
  const motion=useAnimationEngine4();
  const resolved=variant??launchVariant(player,firstRun);
  const beats=useMemo(()=>launchBeats(resolved),[resolved]);
  const [beat,setBeat]=useState(0);
  const [canSkip,setCanSkip]=useState(false);
  const finished=useRef(false);
  const pulse=useSharedValue(0);
  const sweep=useSharedValue(0);
  const finish=useCallback(()=>{
    if(finished.current)return;
    finished.current=true;
    onComplete?.();
  },[onComplete]);

  useEffect(()=>{
    if(!visible)return;
    finished.current=false;
    setBeat(motion.reducedMotion?Math.max(0,beats.length-1):0);
    setCanSkip(motion.reducedMotion);
    if(!motion.reducedMotion){
      pulse.value=withRepeat(withTiming(1,{duration:motion.profile('hero').ambientPulseMs,easing:Easing.inOut(Easing.ease)}),-1,true);
      sweep.value=withRepeat(withTiming(1,{duration:motion.profile('hero').scanDuration,easing:Easing.linear}),-1,false);
    }
    playAudioTheme(resolved==='FIRST_AWAKENING'?'AWAKENING':'HOME');
    playFeedback('SCAN');
    const timers=motion.reducedMotion?[]:beats.slice(1).map((item,index)=>setTimeout(()=>{
      setBeat(index+1);
      if(item.impact==='HIGH')playFeedback('PORTAL');
      else if(item.impact==='MEDIUM')playFeedback('SCAN');
    },item.at));
    const skip=setTimeout(()=>setCanSkip(true),motion.reducedMotion?0:1300);
    const end=setTimeout(finish,motion.reducedMotion?1800:launchDuration(resolved));
    return()=>{
      timers.forEach(clearTimeout);
      clearTimeout(skip);
      clearTimeout(end);
      cancelAnimation(pulse);
      cancelAnimation(sweep);
      stopAudioTheme();
    };
  },[visible,resolved,beats,finish,pulse,sweep,motion]);

  const haloStyle=useAnimatedStyle(()=>({
    opacity:interpolate(pulse.value,[0,1],[.22,.72]),
    transform:[{scale:interpolate(pulse.value,[0,1],[.82,1.18])}],
  }));
  const beamStyle=useAnimatedStyle(()=>({
    opacity:interpolate(sweep.value,[0,.45,1],[0,.68,0]),
    transform:[{translateY:interpolate(sweep.value,[0,1],[-135,165])}],
  }));

  if(!visible)return null;
  const current=beats[Math.min(beat,beats.length-1)];
  const text=current?.text??'SYSTEM ONLINE';
  const threat=resolved==='ASCENDED'?3:resolved==='VETERAN'?2:1;
  const progress=(beat+1)/Math.max(1,beats.length);
  const cinematic=resolved==='FIRST_AWAKENING';
  return <Animated.View entering={FadeIn.duration(motion.duration('fast'))} exiting={FadeOut.duration(motion.duration('normal'))} style={styles.root}>
    <SystemAmbientBackground intensity="hero" screen="LAUNCH" level={player?.realLevel??1} threat={threat} scene={current?.phase==='AWAKENING'?'PORTAL':undefined}/>
    <View style={styles.vignette}/>
    <Text style={styles.topline}>SYSTEM // {cinematic?'AWAKENING PROTOCOL':'CONNECTION RESTORED'}</Text>
    <View style={styles.scanFrame}><View style={[styles.scanProgress,{width:`${Math.round(progress*100)}%`}]} /></View>
    <View style={styles.coreStage}>
      <Animated.View style={[styles.haloOuter,haloStyle]}/>
      <Animated.View style={[styles.haloInner,haloStyle]}/>
      <Animated.View style={[styles.scanBeam,beamStyle]}/>
      <Animated.View entering={ZoomIn.duration(motion.duration('hero'))} exiting={ZoomOut.duration(motion.duration('fast'))} style={[styles.logoOuter,resolved==='ASCENDED'&&styles.logoAscended]}>
        <View style={styles.logoInner}><View style={styles.logoCore}/></View>
      </Animated.View>
    </View>
    <Animated.Text key={text} entering={FadeIn.duration(motion.duration('normal'))} exiting={FadeOut.duration(motion.duration('micro'))} style={styles.signal}>{text}</Animated.Text>
    <Text style={styles.system}>SYSTEM</Text>
    <Text style={styles.meta}>{resolved.replaceAll('_',' ')} // {player?'LV.'+player.realLevel+' · RANK '+player.rank:'ORIGIN SIGNAL'}</Text>
    {cinematic&&<Text style={styles.directive}>TWOJE ŻYCIE. TWOJE ZADANIA. TWÓJ POSTĘP.</Text>}
    {canSkip&&<Pressable accessibilityRole="button" accessibilityLabel="Pomiń animację początkową" style={styles.skip} onPress={finish}>
      <Text style={styles.skipText}>POMIŃ INTRO →</Text>
    </Pressable>}
  </Animated.View>;
}

const styles=StyleSheet.create({
  root:{...StyleSheet.absoluteFill,backgroundColor:'#010305',alignItems:'center',justifyContent:'center',zIndex:1000,overflow:'hidden'},
  vignette:{...StyleSheet.absoluteFill,borderWidth:20,borderColor:'rgba(0,0,0,.30)'},
  topline:{position:'absolute',top:65,alignSelf:'center',color:'#6ceeff',fontSize:9,fontWeight:'900',letterSpacing:2.1},
  scanFrame:{position:'absolute',top:92,left:32,right:32,height:2,backgroundColor:'rgba(108,238,255,.12)',overflow:'hidden'},
  scanProgress:{height:'100%',backgroundColor:'#6ceeff'},
  coreStage:{width:280,height:280,alignItems:'center',justifyContent:'center',overflow:'hidden'},
  haloOuter:{position:'absolute',width:210,height:210,borderWidth:2,borderColor:'#6657e8',borderRadius:110,shadowColor:'#6657e8',shadowOpacity:.85,shadowRadius:38},
  haloInner:{position:'absolute',width:158,height:158,borderWidth:1,borderColor:'#6ceeff',borderRadius:82},
  scanBeam:{position:'absolute',width:252,height:2,backgroundColor:'#6ceeff',shadowColor:'#6ceeff',shadowRadius:18,shadowOpacity:1},
  logoOuter:{width:126,height:126,borderWidth:2,borderColor:'#6ceeff',transform:[{rotate:'45deg'}],alignItems:'center',justifyContent:'center',shadowColor:'#00e5ff',shadowOpacity:.8,shadowRadius:32},
  logoAscended:{width:144,height:144,borderColor:'#fff',shadowRadius:42},
  logoInner:{width:54,height:54,borderWidth:2,borderColor:'#fff',backgroundColor:'rgba(0,229,255,.10)',alignItems:'center',justifyContent:'center'},
  logoCore:{width:16,height:16,borderRadius:8,backgroundColor:'#6ceeff',shadowColor:'#6ceeff',shadowOpacity:1,shadowRadius:16},
  signal:{color:'#f3fdff',fontWeight:'900',fontSize:17,letterSpacing:3,marginTop:12,textAlign:'center'},
  system:{color:'#6ceeff',fontWeight:'900',fontSize:30,letterSpacing:8,marginTop:14},
  meta:{color:'#a5b1ca',fontSize:9,fontWeight:'900',letterSpacing:1.6,marginTop:12,textAlign:'center'},
  directive:{color:'#a8b4cd',fontSize:9,fontWeight:'800',letterSpacing:1.1,marginTop:22,textAlign:'center',paddingHorizontal:25},
  skip:{position:'absolute',bottom:35,alignSelf:'center',paddingVertical:12,paddingHorizontal:20,borderRadius:15,borderWidth:1,borderColor:'rgba(108,238,255,.42)'},
  skipText:{color:'#6ceeff',fontSize:10,fontWeight:'900',letterSpacing:1.4},
});
