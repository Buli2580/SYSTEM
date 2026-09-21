import {useEffect,useState} from 'react';import {useRouter} from 'expo-router';import {Text,View} from 'react-native';import Animated,{FadeInUp} from 'react-native-reanimated';import SystemPage,{pageStyles as s} from '../components/SystemPage';import {useSystem} from '../state/SystemProvider';import {getCloudSocialCounts} from '../cloud/socialCore';import {toPublicPlayerProfile,type SocialCounts} from '../social';import SocialCounters from '../components/SocialCounters';import Action from '../components/Action';
export default function SocialProfileScreen(){const router=useRouter();const{player}=useSystem();const p=toPublicPlayerProfile(player);const[counts,setCounts]=useState<SocialCounts>({followers:0,following:0,friends:0});useEffect(()=>{void getCloudSocialCounts().then(setCounts).catch(()=>{});},[]);
return <SystemPage title="PROFIL SYSTEMU" subtitle="NETWORK // MY IDENTITY" intensity="hero">
<Animated.View entering={FadeInUp.duration(380)} style={[s.panel,{overflow:'hidden'}]}>
 <View style={{position:'absolute',width:180,height:180,borderRadius:90,borderWidth:1,borderColor:'#6ceeff22',right:-60,top:-80}}/>
 <Text style={s.label}>SYSTEM IDENTITY</Text><Text style={[s.title,{fontSize:30}]}>{p.displayName}</Text>
 <View style={{flexDirection:'row',gap:8,flexWrap:'wrap',marginTop:14}}>
  <View style={{borderWidth:1,borderColor:'#6ceeff44',borderRadius:999,paddingHorizontal:12,paddingVertical:7}}><Text style={s.label}>LV {p.level}</Text></View>
  <View style={{borderWidth:1,borderColor:'#e4baff55',borderRadius:999,paddingHorizontal:12,paddingVertical:7}}><Text style={[s.label,{color:'#e4baff'}]}>RANK {p.rank}</Text></View>
  <View style={{borderWidth:1,borderColor:'#ffd36c55',borderRadius:999,paddingHorizontal:12,paddingVertical:7}}><Text style={[s.label,{color:'#ffd36c'}]}>{p.title??'NO TITLE'}</Text></View>
 </View>
 <Text style={s.body}>{p.streak} DAY STREAK · {p.verifiedQuestCount} VERIFIED QUESTS · {p.discoveredSectors} SECTORS</Text>
</Animated.View>
<SocialCounters {...counts}/>
<View style={s.panel}><Text style={s.label}>SOCIAL HUB</Text><Text style={s.body}>Znajomi, rankingi i rywalizacja korzystają z publicznej tożsamości SYSTEMU.</Text><Action label="ZNAJOMI I ZAPROSZENIA →" onPress={()=>router.push('/friends')}/><Action label="RANKINGI →" onPress={()=>router.push('/leaderboard')}/></View>
<View style={s.panel}><Text style={s.label}>PRIVACY SHIELD</Text><Text style={s.body}>E-mail, tokeny i dokładne GPS nie należą do profilu publicznego.</Text></View>
</SystemPage>;}
