import {useReducedMotion} from 'react-native-reanimated';
import {ANIMATION4,motion4Duration,motion4Stagger,type Motion4Intent} from './animation4';

export function useAnimation4(){
 const reduced=useReducedMotion();
 const isReduced=reduced===true;
 return{
  reduced:isReduced,
  duration:(intent:Motion4Intent)=>motion4Duration(intent,isReduced),
  stagger:(index:number)=>motion4Stagger(index,isReduced),
  pressScale:isReduced?1:ANIMATION4.pressScale,
  navActiveScale:isReduced?1:ANIMATION4.navActiveScale,
 } as const;
}
