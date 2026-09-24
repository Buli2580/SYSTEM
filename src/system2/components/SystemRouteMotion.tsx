import type {ReactNode} from 'react';
import Animated,{FadeIn} from 'react-native-reanimated';
import {useAnimationEngine4} from './AnimationEngine4Provider';

export default function SystemRouteMotion({children}:{children:ReactNode}){
 const motion=useAnimationEngine4();
 return <Animated.View
   entering={FadeIn.duration(motion.duration('fast'))}
   style={{flex:1}}
 >{children}</Animated.View>;
}
