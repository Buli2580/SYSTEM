import {createContext,useContext,useEffect,useMemo,useState,type ReactNode} from 'react';
import {AccessibilityInfo} from 'react-native';
import {motionDuration,motionProfile,motionStagger,type MotionIntensity,type MotionProfile,type MotionToken} from '../presentation/animationEngine4';

type AnimationEngine4ContextValue={
 reducedMotion:boolean;
 duration:(token:MotionToken)=>number;
 stagger:(index:number,intensity?:MotionIntensity)=>number;
 profile:(intensity?:MotionIntensity)=>MotionProfile;
};
const AnimationEngine4Context=createContext<AnimationEngine4ContextValue>({
 reducedMotion:false,
 duration:token=>motionDuration(token,false),
 stagger:(index,intensity='default')=>motionStagger(index,intensity,false),
 profile:intensity=>motionProfile(intensity??'default',false),
});

export function AnimationEngine4Provider({children}:{children:ReactNode}){
 const[reducedMotion,setReducedMotion]=useState(false);
 useEffect(()=>{
  let mounted=true;
  void AccessibilityInfo.isReduceMotionEnabled().then(value=>{if(mounted)setReducedMotion(value)}).catch(()=>undefined);
  const sub=AccessibilityInfo.addEventListener('reduceMotionChanged',value=>setReducedMotion(value));
  return()=>{mounted=false;sub.remove()};
 },[]);
 const value=useMemo<AnimationEngine4ContextValue>(()=>({
  reducedMotion,
  duration:token=>motionDuration(token,reducedMotion),
  stagger:(index,intensity='default')=>motionStagger(index,intensity,reducedMotion),
  profile:intensity=>motionProfile(intensity??'default',reducedMotion),
 }),[reducedMotion]);
 return <AnimationEngine4Context.Provider value={value}>{children}</AnimationEngine4Context.Provider>;
}
export function useAnimationEngine4(){return useContext(AnimationEngine4Context);}
