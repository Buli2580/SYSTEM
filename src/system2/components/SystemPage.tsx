import SystemScreen from './SystemScreen';
import SystemError from './SystemError';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated,{FadeInDown,FadeInUp} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SYSTEM_COLORS as C } from '../core';
import { useSystem } from '../state/SystemProvider';
import BottomNavigation from './BottomNavigation';
import SystemAmbientBackground from './SystemAmbientBackground';
import type { ScreenMood, ThreatLevel, WorldSceneId, WorldWeather } from '../visual/types';
import type { AwakeningCinematicState, BossCinematicState } from '../audio/engine';
import {useAnimationEngine4} from './AnimationEngine4Provider';
import SystemMotionLayer from './SystemMotionLayer';

export default function SystemPage({
  title,subtitle,children,intensity='quiet',showNavigation=true,
  screen='HOME',scene,threat=0,weather='CLEAR',bossState,awakeningState,
}:{
  title:string;subtitle:string;children:ReactNode;
  intensity?:'quiet'|'default'|'hero'|'world';
  showNavigation?:boolean;
  screen?:ScreenMood;scene?:WorldSceneId;threat?:ThreatLevel;weather?:WorldWeather;
  bossState?:BossCinematicState;awakeningState?:AwakeningCinematicState;
}) {
  const insets=useSafeAreaInsets();
  const {ready,error,refreshPlayer,player}=useSystem();
  const motion=useAnimationEngine4();
  return <SystemScreen style={styles.root}>
    <SystemAmbientBackground intensity={intensity} screen={screen} scene={scene} threat={threat} weather={weather} level={player.realLevel} bossState={bossState} awakeningState={awakeningState}/>
    <SystemMotionLayer intensity={intensity}/>
    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content,{paddingTop:20,paddingBottom:(showNavigation?150:44)+insets.bottom}]}>
      <Animated.View entering={motion.reducedMotion?undefined:FadeInDown.duration(motion.duration('normal'))} style={styles.headerScrim}>
        <Text style={styles.code}>{subtitle}</Text>
        <Text style={styles.title}>{title}</Text>
      </Animated.View>
      <Animated.View entering={motion.reducedMotion?undefined:FadeInUp.duration(motion.duration(intensity==='hero'||intensity==='world'?'hero':'normal')).delay(motion.stagger(1,intensity))}>
        {ready?children:<View style={styles.panel}>
          {error?<SystemError message={error} retry={()=>{void refreshPlayer();}}/>:<Text style={styles.body}>SYSTEM // URUCHAMIANIE</Text>}
        </View>}
      </Animated.View>
    </ScrollView>
    {showNavigation&&<BottomNavigation/>}
  </SystemScreen>;
}
export const pageStyles=StyleSheet.create({
  panel:{padding:20,marginTop:16,minWidth:0,backgroundColor:'rgba(4,12,16,0.82)',borderWidth:1,borderColor:C.line,borderRadius:20},
  label:{color:C.cyan,fontSize:11,lineHeight:16,fontWeight:'900',letterSpacing:1.35,flexShrink:1},
  title:{color:C.white,fontSize:23,lineHeight:29,fontWeight:'900',marginTop:12,flexShrink:1},
  body:{color:C.textMuted,fontSize:13,lineHeight:21,marginTop:12,flexShrink:1},
  value:{color:C.white,fontSize:28,fontWeight:'900',marginTop:10},
  link:{color:C.cyan,fontSize:12,lineHeight:18,fontWeight:'900',marginTop:20,flexShrink:1},
});
const styles=StyleSheet.create({
  ...pageStyles,
  root:{flex:1,backgroundColor:C.background},
  content:{paddingHorizontal:22},
  headerScrim:{alignSelf:'flex-start',maxWidth:'94%',paddingHorizontal:12,paddingVertical:10,marginLeft:-12,marginBottom:4,borderRadius:14,backgroundColor:'rgba(1,6,9,.46)'},
  code:{color:C.cyan,fontSize:10,fontWeight:'900',letterSpacing:2,textShadowColor:'rgba(0,0,0,.9)',textShadowRadius:8},
  title:{color:C.white,fontSize:32,fontWeight:'900',marginTop:10,marginBottom:2,textShadowColor:'rgba(0,0,0,.95)',textShadowRadius:10},
});
