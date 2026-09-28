import {ArtThumbnail} from './VisualArt';
import {useEffect} from 'react';
import {Modal,Pressable,StyleSheet,Text,View} from 'react-native';
import Animated,{FadeIn,FadeInUp} from 'react-native-reanimated';
import {playFeedback} from '../identity/audio';

const ACCENT={CYAN:'#6ceeff',GOLD:'#ffd36c',VIOLET:'#e4baff'} as const;
export type SystemEvent={id:string;eyebrow:string;title:string;detail?:string;accent?:'CYAN'|'GOLD'|'VIOLET';durationMs?:number;art?:number};

function soundFor(event:SystemEvent){
  if(event.eyebrow.includes('RANK'))return 'RANK_UP' as const;
  if(event.eyebrow.includes('LEVEL'))return 'LEVEL_UP' as const;
  if(event.eyebrow.includes('QUEST'))return 'QUEST_COMPLETE' as const;
  if(event.eyebrow.includes('WORLD')||event.eyebrow.includes('TITLE'))return 'PORTAL' as const;
  return 'XP' as const;
}

export default function SystemEventOverlay({event,onDismiss}:{event:SystemEvent|null;onDismiss:()=>void}){
  useEffect(()=>{
    if(!event)return;
    playFeedback(soundFor(event));
    const t=setTimeout(onDismiss,event.durationMs??2800);
    return()=>clearTimeout(t);
  },[event,onDismiss]);

  if(!event)return null;
  const accent=ACCENT[event.accent??'CYAN'];
  return <Modal transparent animationType="none" onRequestClose={onDismiss}>
    <Pressable accessibilityRole="button" accessibilityLabel="Zamknij komunikat SYSTEMU" onPress={onDismiss} style={styles.root}>
      <View style={[styles.haloOuter,{borderColor:accent+'33'}]}/>
      <View style={[styles.haloInner,{borderColor:accent+'66'}]}/>
      <Animated.View entering={FadeIn.duration(220)} style={[styles.scan,{backgroundColor:accent+'66'}]}/>
      <Animated.View entering={FadeInUp.duration(320)} style={[styles.card,{borderColor:accent+'88',shadowColor:accent}]}>
        <ArtThumbnail source={event.art}/>
        <Text style={[styles.eyebrow,{color:accent}]}>{event.eyebrow}</Text>
        <Text style={styles.title}>{event.title}</Text>
        {event.detail?<Text style={styles.detail}>{event.detail}</Text>:null}
        <View style={styles.rule}><View style={[styles.ruleFill,{backgroundColor:accent}]}/></View>
        <Text style={styles.skip}>DOTKNIJ, ABY KONTYNUOWAĆ</Text>
      </Animated.View>
    </Pressable>
  </Modal>;
}

const styles=StyleSheet.create({
  root:{flex:1,backgroundColor:'#01070be8',justifyContent:'center',padding:24,overflow:'hidden'},
  haloOuter:{position:'absolute',width:340,height:340,borderRadius:170,borderWidth:1,alignSelf:'center',top:'28%'},
  haloInner:{position:'absolute',width:240,height:240,borderRadius:120,borderWidth:1,alignSelf:'center',top:'34%'},
  scan:{position:'absolute',left:0,right:0,top:'46%',height:1},
  card:{borderWidth:1,backgroundColor:'#051114f5',borderRadius:24,padding:24,shadowOpacity:.42,shadowRadius:28},
  eyebrow:{fontSize:10,fontWeight:'900',letterSpacing:3},
  title:{color:'#fff',fontSize:31,lineHeight:37,fontWeight:'900',marginTop:10},
  detail:{color:'#a9bdc6',fontSize:13,marginTop:10,lineHeight:19},
  rule:{height:3,borderRadius:99,overflow:'hidden',backgroundColor:'rgba(255,255,255,.07)',marginTop:21},
  ruleFill:{width:'72%',height:'100%',borderRadius:99},
  skip:{color:'#60757e',fontSize:8,fontWeight:'900',letterSpacing:1.2,textAlign:'center',marginTop:16},
});
