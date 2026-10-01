import { ReactNode, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated,{cancelAnimation,useAnimatedStyle,useSharedValue,withTiming} from 'react-native-reanimated';
import {useFocusEffect} from 'expo-router';
import { characterArt } from '../visual/assets';
import IdentityAvatar from '../components/IdentityAvatar';
import {SceneArt} from './WorldStage';
import {WorldEvent} from './model';
export default function CharacterStage({uri,evolution,avatarStyle,name,event,reaction,animate,onPress,equipment}:{uri?:string;evolution:number;avatarStyle:string;name:string;event:WorldEvent;reaction?:import('../gameMaster/types').CharacterReaction;animate:boolean;onPress:()=>void;equipment?:ReactNode}){
 const reveal=useSharedValue(1);
 useFocusEffect(useCallback(()=>{
  cancelAnimation(reveal);reveal.value=1;
  if(animate){reveal.value=.95;reveal.value=withTiming(1,{duration:650});}
  return ()=>cancelAnimation(reveal);
 },[animate,event,reaction,reveal]));
 const motion=useAnimatedStyle(()=>({opacity:reveal.value,transform:[{scale:reveal.value}]}));
 return <Pressable accessibilityRole="button" accessibilityLabel={`Postać ${name}. Otwórz postać i wyposażenie`} onPress={onPress} style={s.root}>
  <Animated.View pointerEvents="none" style={[s.portrait,motion,(reaction==='VICTORY'||reaction==='LEVEL_UP'||event==='VICTORY')&&s.victory, reaction==='RECOVERY'&&{opacity:.8}]}>
   {uri ? <View style={s.avatar}><IdentityAvatar uri={uri} evolution={evolution} size={124}/></View> : <SceneArt source={characterArt(avatarStyle,evolution)} fit="contain"/>}
  </Animated.View>
  <Text style={s.name}>{name}</Text>
  {equipment && <View pointerEvents="none" style={s.gear}>{equipment}</View>}
 </Pressable>;
}
const s=StyleSheet.create({root:{flex:1,minHeight:100,alignSelf:'center',width:'60%',maxWidth:240,justifyContent:'center'},portrait:{flex:1,minHeight:80,overflow:'hidden'},avatar:{flex:1,alignItems:'center',justifyContent:'center'},victory:{borderBottomWidth:2,borderColor:'#d2b172'},name:{color:'#eef8ff',textAlign:'center',fontSize:12,paddingTop:4},gear:{alignItems:'center',paddingTop:3}});
