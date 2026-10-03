import {memo, useRef, useCallback} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect, useRouter} from 'expo-router';
import type {DomainState} from '../domain/storage';

export default memo(function DomainPanel({domain}: {domain:DomainState|null|undefined}) {
  const router = useRouter();
  const navigating = useRef(false);
  useFocusEffect(useCallback(() => { navigating.current = false; }, []));
  if (!domain) return null;
  const open = (route:'/quests'|'/goals'|'/progression-2'|'/inventory') => {
    if (navigating.current) return;
    navigating.current = true;
    try { router.push(route); } catch (error) { navigating.current = false; throw error; }
  };
  return <View style={s.root} testID="living-domain">
    <Text style={s.title}>{domain.name} · LV {domain.level}</Text>
    <Text style={s.detail}>{domain.level===1?'ZNISZCZONY AZYL':'ODBUDOWA DOMENY'} · {domain.completedQuests}/{domain.nextLevelAt} ukończonych misji · próg kolejnego poziomu</Text>
    {domain.firstAchievement&&<Text accessibilityLiveRegion="polite" style={s.detail}>OSIĄGNIĘCIE DOMENY: PIERWSZY FUNDAMENT</Text>}
    <View style={s.links}>
      <Pressable accessibilityRole="button" onPress={()=>open('/quests')} style={s.link}><Text style={s.text}>COMMAND CENTER · AVAILABLE</Text><Text style={s.detail}>Misje i kierunek AI GM</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={()=>open('/goals')} style={s.link}><Text style={s.text}>ACADEMY · AVAILABLE</Text><Text style={s.detail}>Cele i etapy Journey</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={()=>open('/progression-2')} style={s.link}><Text style={s.text}>ACADEMY → PROGRESSION</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={()=>open('/inventory')} style={s.link}><Text style={s.text}>VAULT · AVAILABLE</Text><Text style={s.detail}>Ekwipunek i wyposażenie</Text></Pressable>
    </View>
    <Text style={s.detail}>FORGE · LOCKED — przyszłe rzemiosło</Text>
    <Text style={s.detail}>SANCTUARY · LOCKED — przyszła regeneracja</Text>
  </View>;
});
const s=StyleSheet.create({root:{gap:5,paddingVertical:10,borderTopWidth:1,borderTopColor:'#28424f'},title:{color:'#bceef5',fontWeight:'700',fontSize:14},detail:{color:'#b3c5d0',fontSize:11,lineHeight:17},links:{flexDirection:'row',flexWrap:'wrap',gap:8},link:{minHeight:48,justifyContent:'center',paddingVertical:6,paddingRight:12,maxWidth:'100%'},text:{color:'#d0edf3',fontSize:11,fontWeight:'700'}});
