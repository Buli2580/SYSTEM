import {useAnimationEngine4} from '../components/AnimationEngine4Provider';
import {ANIMATION4,motion4Duration,motion4Stagger,type Motion4Intent} from './animation4';

export function useAnimation4(){
 const engine=useAnimationEngine4();
 return{
  reduced:engine.reducedMotion,
  duration:(intent:Motion4Intent)=>motion4Duration(intent,engine.reducedMotion),
  stagger:(index:number)=>motion4Stagger(index,engine.reducedMotion),
  pressScale:engine.reducedMotion?1:ANIMATION4.pressScale,
  navActiveScale:engine.reducedMotion?1:ANIMATION4.navActiveScale,
  profile:engine.profile,
 } as const;
}
