import {useEffect,useState} from 'react';
import {useRouter} from 'expo-router';
import {Share,Text,View} from 'react-native';
import Animated,{FadeInUp} from 'react-native-reanimated';
import SystemPage,{pageStyles as s} from '../components/SystemPage';
import {useSystem} from '../state/SystemProvider';
import {getCloudSocialCounts} from '../cloud/socialCore';
import {getValidSession} from '../cloud/auth';
import {toPublicPlayerProfile,type SocialCounts} from '../social';
import SocialCounters from '../components/SocialCounters';
import Action from '../components/Action';
import {createShareCard} from '../social/shareCard';
import {shareText} from '../presentation/share';
import {SOCIAL_HUB_MODULES} from '../beta/social';
import SystemPlayerCard from '../cards/SystemPlayerCard';
import {buildSystemCard} from '../cards/engine';
import SocialCommandDeck from '../components/SocialCommandDeck';

export default function SocialProfileScreen(){
 const router=useRouter();
 const{player}=useSystem();
 const p=toPublicPlayerProfile(player);
 const heroCard=buildSystemCard(player);
 const[counts,setCounts]=useState<SocialCounts>({followers:0,following:0,friends:0});
 const[online,setOnline]=useState<boolean|null>(null);
 const[networkError,setNetworkError]=useState<string|null>(null);

 useEffect(()=>{
  let active=true;
  void (async()=>{
   try{
    const session=await getValidSession();
    if(!active)return;
    if(!session){setOnline(false);setNetworkError(null);return;}
    setOnline(true);
    const next=await getCloudSocialCounts();
    if(active){setCounts(next);setNetworkError(null);}
   }catch{
    if(active){setOnline(false);setNetworkError('SYSTEM ONLINE jest chwilowo niedostępny. Lokalny profil i progres nadal działają.');}
   }
  })();
  return()=>{active=false;};
 },[]);

 return <SystemPage title="PROFIL SYSTEMU" subtitle="NETWORK // MY IDENTITY" intensity="hero">
  <Animated.View entering={FadeInUp.duration(380)} style={[s.panel,{overflow:'hidden'}]}>
   <View style={{position:'absolute',width:180,height:180,borderRadius:90,borderWidth:1,borderColor:'#6ceeff22',right:-60,top:-80}}/>
   <Text style={s.label}>SYSTEM IDENTITY // {online?'ONLINE':online===false?'LOCAL':'CHECKING'}</Text>
   <Text style={[s.title,{fontSize:30}]}>{p.displayName}</Text>
   <View style={{flexDirection:'row',gap:8,flexWrap:'wrap',marginTop:14}}>
    <View style={{borderWidth:1,borderColor:'#6ceeff44',borderRadius:999,paddingHorizontal:12,paddingVertical:7}}><Text style={s.label}>LV {p.level}</Text></View>
    <View style={{borderWidth:1,borderColor:'#e4baff55',borderRadius:999,paddingHorizontal:12,paddingVertical:7}}><Text style={[s.label,{color:'#e4baff'}]}>RANK {p.rank}</Text></View>
    <View style={{borderWidth:1,borderColor:'#ffd36c55',borderRadius:999,paddingHorizontal:12,paddingVertical:7}}><Text style={[s.label,{color:'#ffd36c'}]}>{p.title??'NO TITLE'}</Text></View>
   </View>
   <Text style={s.body}>{p.streak} DAY STREAK · {p.verifiedQuestCount} VERIFIED QUESTS · {p.discoveredSectors} SECTORS</Text>
  </Animated.View>

  {online?<SocialCounters {...counts}/>:<View style={s.panel}>
   <Text style={s.label}>SYSTEM ONLINE // {networkError?'NETWORK ERROR':'OFFLINE'}</Text>
   <Text style={s.body}>{networkError??'Profil lokalny działa bez konta. Liczniki znajomych, obserwujących i rankingi pojawią się po połączeniu SYSTEM CLOUD.'}</Text>
   <Action label="KONTO I CHMURA →" onPress={()=>router.push('/account')}/>
  </View>}

  <View style={s.panel}>
   <Text style={s.label}>PUBLIC HERO CARD // {heroCard.heroName}</Text>
   <Text style={s.body}>To jest karta, którą możesz pokazywać w Social. Pokazuje tylko publiczny progres SYSTEMU — bez e-maila, tokenów i dokładnej lokalizacji.</Text>
   <SystemPlayerCard player={player}/>
  </View>

  <View style={s.panel}><Text style={s.label}>SOCIAL 2.1 // NETWORK MODULES</Text><Text style={s.body}>{SOCIAL_HUB_MODULES.join(' · ')}</Text><Action label="UDOSTĘPNIJ PROFIL / RANGĘ →" onPress={()=>{const card=createShareCard({event:'RANK',value:`${heroCard.heroName} · RANK ${p.rank} · POWER ${heroCard.power.toLocaleString()}`,level:p.level,rank:p.rank,streak:p.streak});void Share.share({message:shareText(card)});}}/></View>
  <SocialCommandDeck online={online} counts={counts}/>
  <View style={s.panel}><Text style={s.label}>PRIVACY SHIELD</Text><Text style={s.body}>E-mail, tokeny i dokładne GPS nie należą do profilu publicznego.</Text></View>
 </SystemPage>;
}
