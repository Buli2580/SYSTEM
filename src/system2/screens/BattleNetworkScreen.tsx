import {useEffect,useState} from 'react';
import {Share,Text,TextInput,View} from 'react-native';
import {useRouter} from 'expo-router';
import SystemPage,{pageStyles as s} from '../components/SystemPage';
import Action from '../components/Action';
import SystemError from '../components/SystemError';
import {useSystem} from '../state/SystemProvider';
import {acceptPvpChallenge,attachReferralCode,getActiveGuildWars,getMyPvpChallenges,getReferralState,ensureReferralCode,type CloudPvpChallenge,type CloudGuildWar,type CloudReferralState} from '../cloud/socialBattle';
import {getValidSession} from '../cloud/auth';

export default function BattleNetworkScreen(){
 const {player}=useSystem(),router=useRouter();
 const[pvp,setPvp]=useState<CloudPvpChallenge[]>([]),[wars,setWars]=useState<CloudGuildWar[]>([]),[referral,setReferral]=useState<CloudReferralState|null>(null),[cloudUserId,setCloudUserId]=useState<string|null>(null),[referralInput,setReferralInput]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);
 async function load(){
  setBusy(true);setError(null);
  try{
   await ensureReferralCode();
   const [p,w,r,session]=await Promise.all([getMyPvpChallenges(),getActiveGuildWars(),getReferralState(),getValidSession()]);
   setPvp(p);setWars(w);setReferral(r);setCloudUserId(session?.user.id??null);
  }catch(e){setError(e instanceof Error?e.message:'BATTLE_NETWORK_FAILED');}
  finally{setBusy(false);}
 }
 useEffect(()=>{void load()},[]);
 async function accept(id:string){setBusy(true);setError(null);try{await acceptPvpChallenge(id);await load()}catch(e){setError(e instanceof Error?e.message:'PVP_ACCEPT_FAILED');setBusy(false)}}
 return <SystemPage title="BATTLE NETWORK" subtitle="PVP // GUILD WARS // RAIDS // SEASONS">
  <View style={s.panel}><Text style={s.label}>PLAYER NODE</Text><Text style={s.title}>{player.displayName}</Text><Text style={s.body}>Serwer przyjmuje wynik tylko z kanonicznych verified events. Telefon nie może sam dopisać punktów.</Text><Action label={busy?'SYNCING…':'ODŚWIEŻ NETWORK'} disabled={busy} onPress={()=>void load()}/></View>
  {error&&<SystemError message={error} retry={()=>void load()}/>}
  <View style={s.panel}><Text style={s.label}>PVP CHALLENGES // LIVE</Text><Text style={s.title}>{pvp.filter(x=>x.status==='ACTIVE'||x.status==='OPEN').length} ACTIVE / OPEN</Text>
   {pvp.length===0?<Text style={s.body}>Brak wyzwań PvP na tym koncie.</Text>:pvp.slice(0,8).map(row=>{const rival=row.my_side==='CREATOR'?row.opponent_name:row.creator_name;const leading=row.my_score===row.rival_score?'TIE':row.my_score>row.rival_score?'LEADING':'TRAILING';return <View key={row.id} style={{marginTop:12}}><Text style={s.label}>{row.metric} // {row.status} // {leading}</Text><Text style={s.title}>VS {rival}</Text><Text style={s.body}>YOU {row.my_score} : {row.rival_score} RIVAL · TARGET {row.target} · {row.progress_percent}%</Text><View style={{height:5,borderRadius:5,overflow:'hidden',backgroundColor:'#17333e',marginTop:7}}><View style={{height:'100%',width:`${Math.max(2,row.progress_percent)}%`,backgroundColor:'#6ceeff'}}/></View>{row.status==='OPEN'&&row.opponent_id===cloudUserId&&<Action label="AKCEPTUJ PVP →" disabled={busy} onPress={()=>void accept(row.id)}/>} {row.status==='OPEN'&&row.creator_id===cloudUserId&&<Text style={s.body}>WAITING FOR OPPONENT</Text>}</View>})}
   <Text style={s.body}>PvP 3.0 używa wyłącznie QUESTS / REAL_XP pochodzących z serwerowego verified reward ledger.</Text>
  </View>
  <View style={s.panel}><Text style={s.label}>GUILD WARS // LIVE</Text><Text style={s.title}>{wars.filter(x=>x.status==='ACTIVE').length} ACTIVE</Text>
   {wars.length===0?<Text style={s.body}>Brak wojny Twojej gildii.</Text>:wars.slice(0,6).map(w=>{const my=w.my_side==='A'?w.guild_a_name:w.guild_b_name;const rival=w.my_side==='A'?w.guild_b_name:w.guild_a_name;const mine=w.my_side==='A'?w.score_a:w.score_b;const theirs=w.my_side==='A'?w.score_b:w.score_a;return <View key={w.id} style={{marginTop:12}}><Text style={s.label}>{w.status} // MY CONTRIBUTION {w.my_contribution}</Text><Text style={s.title}>{my} VS {rival}</Text><Text style={s.body}>{mine} : {theirs} · VERIFIED EVENTS {w.my_verified_events}</Text></View>})}
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