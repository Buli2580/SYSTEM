import {useEffect,useRef,useState} from 'react';
import {Text,View} from 'react-native';
import {useRouter} from 'expo-router';
import SystemPage,{pageStyles as s} from '../components/SystemPage';
import Action from '../components/Action';
import SystemError from '../components/SystemError';
import {getCloudFriendNetwork,removeCloudFriend,respondCloudFriendRequest,type CloudFriendRow} from '../cloud/socialCore';
import {createPvpChallenge} from '../cloud/socialBattle';

export default function FriendsScreen(){
 const router=useRouter();
 const[rows,setRows]=useState<CloudFriendRow[]>([]);
 const[busy,setBusy]=useState(true),[loaded,setLoaded]=useState(false),[error,setError]=useState<string|null>(null);
 const lock=useRef(false),mounted=useRef(true),epoch=useRef(0);

 useEffect(()=>{void refresh();return()=>{mounted.current=false;epoch.current++;};},[]);

 async function fetchRows(id:number){const next=await getCloudFriendNetwork();if(mounted.current&&id===epoch.current){setRows(next);setLoaded(true);}}
 async function refresh(){
  if(lock.current)return;lock.current=true;const id=++epoch.current;
  if(mounted.current){setBusy(true);setError(null);setRows([]);}
  try{await fetchRows(id);}catch(e){if(mounted.current&&id===epoch.current){setLoaded(true);setError(e instanceof Error?e.message:'FRIENDS_FAILED');}}
  finally{lock.current=false;if(mounted.current&&id===epoch.current)setBusy(false);}
 }
 async function mutate(task:()=>Promise<void>){
  if(lock.current)return;lock.current=true;const id=++epoch.current;
  if(mounted.current){setBusy(true);setError(null);}
  try{await task();await fetchRows(id);}
  catch(e){if(mounted.current&&id===epoch.current)setError(e instanceof Error?e.message:'FRIENDS_FAILED');}
  finally{lock.current=false;if(mounted.current&&id===epoch.current)setBusy(false);}
 }

 return <SystemPage title="ZNAJOMI" subtitle="SYSTEM ONLINE // NETWORK">
  <View style={s.panel}><Text style={s.label}>TWOJA SIEĆ</Text><Text style={s.body}>Zaproszenia i znajomi są oddzieleni od obserwowania. Ty decydujesz, kogo wpuszczasz bliżej.</Text><Action label="ZNAJDŹ GRACZA →" onPress={()=>router.push('/player-search')}/><Action label={busy?'ŁADOWANIE…':'ODŚWIEŻ'} disabled={busy} onPress={()=>void refresh()}/></View>
  {error&&<SystemError message={error} retry={()=>void refresh()}/>}
  {!error&&loaded&&!busy&&rows.length===0&&<View style={s.panel}><Text style={s.body}>Brak zaproszeń i znajomych.</Text></View>}
  {rows.map(x=><View key={x.user_id} style={s.panel}><Text style={s.title}>{x.public_name||('@'+(x.handle||'gracz'))}</Text><Text style={s.body}>LV {x.real_level} · {x.rank} · {x.status}</Text>{x.status==='REQUEST_RECEIVED'&&<><Action label="AKCEPTUJ" disabled={busy} onPress={()=>void mutate(()=>respondCloudFriendRequest(x.user_id,true))}/><Action label="ODRZUĆ" disabled={busy} onPress={()=>void mutate(()=>respondCloudFriendRequest(x.user_id,false))}/></>}{x.status==='FRIENDS'&&<><Action label="PVP // 3 VERIFIED QUESTS" disabled={busy} onPress={()=>void mutate(async()=>{await createPvpChallenge(x.user_id,'QUESTS',3,24)})}/><Action label="PVP // 300 VERIFIED REAL XP" disabled={busy} onPress={()=>void mutate(async()=>{await createPvpChallenge(x.user_id,'REAL_XP',300,24)})}/><Action label="USUŃ ZE ZNAJOMYCH" disabled={busy} onPress={()=>void mutate(()=>removeCloudFriend(x.user_id))}/></>}</View>)}
 </SystemPage>;
}
