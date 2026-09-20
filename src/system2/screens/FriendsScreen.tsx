import {useEffect,useState} from 'react';
import {Text,View} from 'react-native';
import {useRouter} from 'expo-router';
import SystemPage,{pageStyles as s} from '../components/SystemPage';
import Action from '../components/Action';
import SystemError from '../components/SystemError';
import {getCloudFriendNetwork,removeCloudFriend,respondCloudFriendRequest,type CloudFriendRow} from '../cloud/socialCore';
export default function FriendsScreen(){const router=useRouter();const[rows,setRows]=useState<CloudFriendRow[]>([]);const[busy,setBusy]=useState(false);const[error,setError]=useState<string|null>(null);
async function load(){setRows(await getCloudFriendNetwork());}
async function run(task:()=>Promise<void>){if(busy)return;setBusy(true);setError(null);try{await task();await load();}catch(e){setError(e instanceof Error?e.message:'FRIENDS_FAILED');}finally{setBusy(false);}}
useEffect(()=>{void run(async()=>{});},[]);
return <SystemPage title="ZNAJOMI" subtitle="SYSTEM ONLINE // NETWORK"><View style={s.panel}><Text style={s.label}>TWOJA SIEĆ</Text><Text style={s.body}>Zaproszenia i znajomi są oddzieleni od obserwowania. Ty decydujesz, kogo wpuszczasz bliżej.</Text><Action label="ZNAJDŹ GRACZA →" onPress={()=>router.push('/player-search')}/></View>
{rows.length===0?<View style={s.panel}><Text style={s.body}>Brak zaproszeń i znajomych.</Text></View>:rows.map(x=><View key={x.user_id} style={s.panel}><Text style={s.title}>{x.public_name||('@'+(x.handle||'gracz'))}</Text><Text style={s.body}>LV {x.real_level} · {x.rank} · {x.status}</Text>{x.status==='REQUEST_RECEIVED'&&<><Action label="AKCEPTUJ" disabled={busy} onPress={()=>void run(()=>respondCloudFriendRequest(x.user_id,true))}/><Action label="ODRZUĆ" disabled={busy} onPress={()=>void run(()=>respondCloudFriendRequest(x.user_id,false))}/></>}{x.status==='FRIENDS'&&<Action label="USUŃ ZE ZNAJOMYCH" disabled={busy} onPress={()=>void run(()=>removeCloudFriend(x.user_id))}/>}</View>)}
{error&&<SystemError message={error} retry={()=>void run(async()=>{})}/>}</SystemPage>;}
