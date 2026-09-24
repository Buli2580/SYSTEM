import {useEffect,useState} from 'react';
import {Share,Text,TextInput,View} from 'react-native';
import {useRouter} from 'expo-router';
import SystemPage,{pageStyles as s} from '../components/SystemPage';
import Action from '../components/Action';
import SystemError from '../components/SystemError';
import {useSystem} from '../state/SystemProvider';
import {attachReferralCode,getActiveGuildWars,getMyPvpChallenges,getReferralState,ensureReferralCode,type CloudPvpChallenge,type CloudGuildWar,type CloudReferralState} from '../cloud/socialBattle';

export default function BattleNetworkScreen(){
 const {player}=useSystem(),router=useRouter();
 const[pvp,setPvp]=useState<CloudPvpChallenge[]>([]),[wars,setWars]=useState<CloudGuildWar[]>([]),[referral,setReferral]=useState<CloudReferralState|null>(null),[referralInput,setReferralInput]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);
 async function load(){
  setBusy(true);setError(null);
  try{
   await ensureReferralCode();
   const [p,w,r]=await Promise.all([getMyPvpChallenges(),getActiveGuildWars(),getReferralState()]);
   setPvp(p);setWars(w);setReferral(r);
  }catch(e){setError(e instanceof Error?e.message:'BATTLE_NETWORK_FAILED');}
  finally{setBusy(false);}
 }
 useEffect(()=>{void load()},[]);
 return <SystemPage title="BATTLE NETWORK" subtitle="PVP // GUILD WARS // RAIDS // SEASONS">
  <View style={s.panel}><Text style={s.label}>PLAYER NODE</Text><Text style={s.title}>{player.displayName}</Text><Text style={s.body}>Serwer przyjmuje wynik tylko z kanonicznych verified events. Telefon nie może sam dopisać punktów.</Text><Action label={busy?'SYNCING…':'ODŚWIEŻ NETWORK'} disabled={busy} onPress={()=>void load()}/></View>
  {error&&<SystemError message={error} retry={()=>void load()}/>}
  <View style={s.panel}><Text style={s.label}>PVP CHALLENGES // LIVE</Text><Text style={s.title}>{pvp.filter(x=>x.status==='ACTIVE'||x.status==='OPEN').length} ACTIVE / OPEN</Text>
   {pvp.length===0?<Text style={s.body}>Brak wyzwań PvP na tym koncie.</Text>:pvp.slice(0,5).map(row=><View key={row.id} style={{marginTop:10}}><Text style={s.body}>{row.metric} · {row.creator_score}:{row.opponent_score} / TARGET {row.target} · {row.status}</Text></View>)}
   <Text style={s.body}>PvP 2.0 obsługuje teraz QUESTS i REAL_XP pochodzące wyłącznie ze zweryfikowanego reward ledger.</Text>
  </View>
  <View style={s.panel}><Text style={s.label}>GUILD WARS // LIVE</Text><Text style={s.title}>{wars.filter(x=>x.status==='ACTIVE').length} ACTIVE</Text>
   {wars.length===0?<Text style={s.body}>Brak aktywnej wojny Twojej gildii.</Text>:wars.slice(0,4).map(w=><Text key={w.id} style={s.body}>WAR // {w.score_a} : {w.score_b} · {w.status}</Text>)}
   <Action label="GILDIE →" onPress={()=>router.push('/guilds')}/>
  </View>
  <View style={s.panel}><Text style={s.label}>RAID 2.0 / SEASONS 2.0</Text><Action label="WORLD RAIDS →" onPress={()=>router.push('/raids')}/><Action label="SEASONS →" onPress={()=>router.push('/seasons')}/></View>
  <View style={s.panel}><Text style={s.label}>REFERRAL SYSTEM // VERIFIED ACTIVATION</Text><Text style={s.title}>{referral?.code||'LOGIN REQUIRED'}</Text><Text style={s.body}>INVITED {referral?.invited??0} · ACTIVATED {referral?.activated??0}</Text><Text style={s.body}>Kod tworzy powiązanie. Aktywacja następuje dopiero po pierwszym zweryfikowanym zdarzeniu gracza — bez farmienia pustych kont.</Text>
   {!!referral?.code&&<Action label="UDOSTĘPNIJ KOD →" onPress={()=>{void Share.share({message:'SYSTEM // dołącz przez kod '+referral.code})}}/>}
   <TextInput autoCapitalize="characters" value={referralInput} onChangeText={setReferralInput} placeholder="SYS-XXXXXXXX" placeholderTextColor="#708690" style={{color:'#fff',minHeight:48,borderWidth:1,borderColor:'#24505c',borderRadius:12,paddingHorizontal:12,marginTop:10}}/>
   <Action label="PRZYPISZ KOD ZAPROSZENIA" disabled={busy||referralInput.trim().length<12} onPress={()=>{void (async()=>{setBusy(true);setError(null);try{await attachReferralCode(referralInput);setReferralInput('');await load()}catch(e){setError(e instanceof Error?e.message:'REFERRAL_FAILED');setBusy(false)}})()}}/>
  </View>
 </SystemPage>;
}