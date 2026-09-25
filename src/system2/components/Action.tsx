import {Pressable,StyleSheet,Text} from 'react-native';
import Animated,{Easing,useAnimatedStyle,useSharedValue,withTiming} from 'react-native-reanimated';
import {SYSTEM_COLORS as C} from '../core';
import {playFeedback} from '../identity/audio';
import {useAnimation4} from '../presentation/useAnimation4';

export default function Action({label,onPress,disabled=false,danger=false}:{label:string;onPress:()=>void;disabled?:boolean;danger?:boolean}){
 const motion=useAnimation4();
 const scale=useSharedValue(1);
 const animated=useAnimatedStyle(()=>({transform:[{scale:scale.value}]}));
 function pressIn(){scale.value=motion.reduced?motion.pressScale:withTiming(motion.pressScale,{duration:motion.duration('MICRO'),easing:Easing.out(Easing.quad)})}
 function pressOut(){scale.value=motion.reduced?1:withTiming(1,{duration:motion.duration('MICRO'),easing:Easing.out(Easing.quad)})}
 return <Animated.View style={[styles.wrap,animated]}>
  <Pressable
   accessibilityRole="button" accessibilityLabel={label} accessibilityState={{disabled}}
   disabled={disabled}
   onPressIn={pressIn}
   onPressOut={pressOut}
   onPress={()=>{playFeedback('UI_TAP');onPress();}}
   style={({pressed})=>[styles.root,danger?styles.danger:styles.normal,disabled&&styles.disabled,pressed&&styles.pressed]}>
   <Text numberOfLines={2} adjustsFontSizeToFit style={[styles.text,danger?styles.dangerText:styles.normalText]}>{label}</Text>
  </Pressable>
 </Animated.View>;
}
const styles=StyleSheet.create({
 wrap:{marginTop:10},
 root:{minHeight:48,justifyContent:'center',padding:12,borderRadius:10},
 normal:{backgroundColor:C.panelSoft},
 danger:{backgroundColor:'rgba(255,80,103,0.16)'},
 disabled:{opacity:.45},
 pressed:{opacity:.82},
 text:{fontSize:12,lineHeight:17,fontWeight:'900',textAlign:'center',flexShrink:1},
 normalText:{color:C.cyan},
 dangerText:{color:'#FFB9B9'},
});
