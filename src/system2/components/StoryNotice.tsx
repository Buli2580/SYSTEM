import { useEffect, useState } from 'react';
import { Pressable, Text } from 'react-native';
import Animated,{FadeInDown} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSystem } from '../state/SystemProvider';
import { consumeStoryEvent } from '../storage/database';
import { awaitWithTimeout } from '../storage/awaitWithTimeout';
import type { StoryEvent } from '../story/types';
import {useAnimationEngine4} from './AnimationEngine4Provider';
export default function StoryNotice() {
 const motion=useAnimationEngine4();
 const {story,ready,onboardingComplete,celebration,awakeningPending,refreshPlayer}=useSystem();
 const [visible,setVisible]=useState<StoryEvent|null>(null);
 const event=story?.pendingEvents[0];
 const blocked=Boolean(celebration||awakeningPending);
 useEffect(()=>{
  if(!ready||!onboardingComplete||celebration||awakeningPending||!event||visible)return;
  let active=true;
  // Consume durably before displaying: a crash cannot replay this overlay on each startup.
  void awaitWithTimeout(consumeStoryEvent(event.id)).then(()=>{if(active)setVisible(event);void refreshPlayer();}).catch(()=>undefined);
  return()=>{active=false;};
 },[event?.id,ready,onboardingComplete,celebration,awakeningPending,visible,refreshPlayer]);
 useEffect(()=>{if(!visible||blocked)return;const timer=setTimeout(()=>setVisible(null),3500);return()=>clearTimeout(timer);},[visible,blocked]);
 if(!visible||!ready||blocked)return null;
 return <SafeAreaView edges={['top']} pointerEvents="box-none" style={{position:'absolute',top:0,left:14,right:14,zIndex:100}}><Animated.View entering={motion.reducedMotion?undefined:FadeInDown.duration(motion.duration('normal'))}>
  <Pressable accessibilityRole="button" accessibilityLabel="Zamknij wiadomość SYSTEMU" onPress={()=>setVisible(null)} style={{padding:18,backgroundColor:'#071e29',borderWidth:1,borderColor:'#62efff',borderRadius:14}}>
   <Text style={{color:'#62efff',fontSize:11,fontWeight:'900'}}>{visible.type.replaceAll('_',' ')}</Text><Text style={{color:'#fff',fontWeight:'900',marginTop:6}}>{visible.title}</Text>
  </Pressable>
 </Animated.View></SafeAreaView>;
}
