import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname, useRouter } from 'expo-router';
import { SYSTEM_COLORS } from '../core';

const ITEMS=[['HOME','/','⌂'],['QUEST','/quests','⚔'],['CHARACTER','/character','♙'],['WORLD','/world','◇'],['SOCIAL','/social','✦']] as const;
export default function BottomNavigation(){
 const insets=useSafeAreaInsets(),pathname=usePathname(),router=useRouter();
 return <View style={[s.root,{paddingBottom:Math.max(insets.bottom,8)}]}>{ITEMS.map(([label,path,glyph])=>{
  const active=path==='/'?pathname==='/':pathname===path||(path==='/character'&&pathname==='/system-log');
  return <Pressable key={path} style={s.item} onPress={()=>router.replace(path)} accessibilityRole="button" accessibilityState={{selected:active}} accessibilityLabel={label}>
   <View style={[s.signal,active&&s.signalActive]}><Text style={[s.glyph,active&&s.glyphActive]}>{glyph}</Text></View>
   <Text style={[s.label,active&&s.labelActive]}>{label}</Text>
  </Pressable>})}</View>
}
const s=StyleSheet.create({root:{position:'absolute',left:0,right:0,bottom:0,minHeight:98,borderTopWidth:1,borderTopColor:'rgba(81,216,255,.18)',backgroundColor:'rgba(1,6,8,.97)',flexDirection:'row',paddingTop:12},item:{flex:1,alignItems:'center',minHeight:56},signal:{width:31,height:31,alignItems:'center',justifyContent:'center',borderTopWidth:1,borderBottomWidth:1,borderColor:'rgba(110,151,163,.25)',marginBottom:8},signalActive:{borderColor:SYSTEM_COLORS.cyan,backgroundColor:'rgba(56,214,255,.08)'},glyph:{color:SYSTEM_COLORS.textVeryMuted,fontSize:17,fontWeight:'900'},glyphActive:{color:SYSTEM_COLORS.cyan},label:{color:SYSTEM_COLORS.textVeryMuted,fontSize:7,fontWeight:'900',letterSpacing:.8},labelActive:{color:SYSTEM_COLORS.cyan}});