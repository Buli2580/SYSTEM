import {Pressable,StyleSheet,Text,View} from 'react-native';
import Animated,{FadeInUp} from 'react-native-reanimated';
import type {WorldEvent} from '../world/events';
import {formatWorldEventRemaining} from '../world/events';

const ACCENT:Record<WorldEvent['kind'],string>={
  PORTAL_OPENED:'#6ceeff',
  INVASION:'#ff708c',
  ELITE_ENEMY:'#e4baff',
  ANOMALY:'#9d7cff',
  RELIC_SIGNAL:'#ffd36c',
  MINI_BOSS:'#ff9c5a',
};

export default function WorldEventHUD({
  event,now=Date.now(),onAction,compact=false,
}:{event:WorldEvent;now?:number;onAction?:()=>void;compact?:boolean}){
  const accent=ACCENT[event.kind];
  const body=<Animated.View entering={FadeInUp.duration(360)} style={[styles.root,compact&&styles.compact,{borderColor:accent+'88'}]}>
    <View style={styles.top}>
      <Text style={[styles.code,{color:accent}]}>WORLD EVENT // {event.kind.replaceAll('_',' ')}</Text>
      <Text style={styles.timer}>{formatWorldEventRemaining(event,now)}</Text>
    </View>
    <Text style={[styles.title,compact&&styles.compactTitle]}>{event.title}</Text>
    {!compact&&<Text style={styles.subtitle}>{event.subtitle}</Text>}
    <View style={styles.metaRow}>
      <Text style={styles.meta}>{event.sector}</Text>
      <Text style={[styles.meta,{color:accent}]}>THREAT {event.threat}</Text>
      <Text style={styles.meta}>{event.rewardTag}</Text>
    </View>
    <View style={styles.directive}>
      <Text style={styles.directiveLabel}>DIRECTIVE</Text>
      <Text style={styles.directiveValue}>{event.recommendedAction}</Text>
    </View>
    {!!onAction&&<Text style={[styles.cta,{color:accent}]}>OTWÓRZ PROTOKÓŁ →</Text>}
  </Animated.View>;
  return onAction?<Pressable accessibilityRole="button" onPress={onAction}>{body}</Pressable>:body;
}

const styles=StyleSheet.create({
  root:{marginTop:12,padding:15,borderWidth:1,borderRadius:18,backgroundColor:'rgba(5,13,18,.92)'},
  compact:{padding:12,borderRadius:15},
  top:{flexDirection:'row',justifyContent:'space-between',gap:12,alignItems:'center'},
  code:{flex:1,minWidth:0,fontSize:8,lineHeight:12,fontWeight:'900',letterSpacing:1.1},
  timer:{color:'#ffd36c',fontSize:8,fontWeight:'900'},
  title:{color:'#fff',fontSize:20,lineHeight:25,fontWeight:'900',marginTop:7},
  compactTitle:{fontSize:16,lineHeight:21},
  subtitle:{color:'#9fb4bd',fontSize:10,lineHeight:16,marginTop:7},
  metaRow:{flexDirection:'row',flexWrap:'wrap',gap:10,marginTop:10},
  meta:{color:'#718791',fontSize:8,fontWeight:'900',letterSpacing:.8},
  directive:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:11,paddingTop:10,borderTopWidth:1,borderTopColor:'rgba(120,180,200,.13)'},
  directiveLabel:{color:'#60757e',fontSize:8,fontWeight:'900',letterSpacing:1},
  directiveValue:{color:'#fff',fontSize:9,fontWeight:'900',letterSpacing:1.2},
  cta:{fontSize:9,fontWeight:'900',letterSpacing:1.1,marginTop:11},
});
