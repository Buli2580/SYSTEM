import {useEffect,useMemo,useRef,useState} from 'react';
import {Text,TextInput,View} from 'react-native';
import {useRouter} from 'expo-router';
import SystemPage,{pageStyles as s} from '../components/SystemPage';
import Action from '../components/Action';
import SystemError from '../components/SystemError';
import {searchPlayers} from '../cloud/social';
import {cloudProfileToPublic,normalizePlayerSearch,type PublicPlayerProfile} from '../social';

export default function PlayerSearchScreen(){
 const router=useRouter();
 const[q,setQ]=useState(''),[rows,setRows]=useState<PublicPlayerProfile[]>([]),[error,setError]=useState<string|null>(null),[busy,setBusy]=useState(false),[searched,setSearched]=useState(false);
 const mounted=useRef(true),epoch=useRef(0),lock=useRef(false);
 useEffect(()=>()=>{mounted.current=false;epoch.current++;},[]);
 const normalized=useMemo(()=>normalizePlayerSearch(q),[q]),valid=normalized.length>=2;

 async function run(){
  if(lock.current||!valid)return;lock.current=true;const id=++epoch.current;
  if(mounted.current){setBusy(true);setError(null);setRows([]);setSearched(false);}
  try{const found=await searchPlayers(normalized);if(mounted.current&&id===epoch.current){setRows(found.map(cloudProfileToPublic));setSearched(true);}}
  catch(e){if(mounted.current&&id===epoch.current){setRows([]);setSearched(true);setError(e instanceof Error?e.message:'SEARCH_FAILED');}}
  finally{lock.current=false;if(mounted.current&&id===epoch.current)setBusy(false);}
 }

 return <SystemPage title="ZNAJDŹ GRACZA" subtitle="NETWORK // CLOUD SEARCH">
  <View style={s.panel}><Text style={s.label}>SYSTEM ID / DISPLAY NAME</Text>
   <TextInput value={q} onChangeText={value=>{setQ(value);setRows([]);setError(null);setSearched(false);epoch.current++;}} autoCapitalize="none" placeholder="min. 2 znaki" placeholderTextColor="#8397a3" style={{color:'#fff',minHeight:52,borderWidth:1,borderColor:'#24505c',borderRadius:12,paddingHorizontal:14,marginTop:10}}/>
   <Action label={busy?'SZUKAM...':'SZUKAJ'} disabled={!valid||busy} onPress={()=>void run()}/>
   <Action label="RANKINGI →" onPress={()=>router.replace('/leaderboard')}/>
   {error&&<SystemError message={error} retry={()=>void run()}/>}
  </View>
  {!error&&searched&&!busy&&rows.length===0&&<View style={s.panel}><Text style={s.body}>Brak publicznych graczy pasujących do tego wyszukiwania.</Text></View>}
  {rows.map(p=><View key={p.playerId} style={s.panel}><Text style={s.label}>SYSTEM CLOUD</Text><Text style={s.title}>{p.displayName}</Text><Text style={s.body}>LV {p.level} · {p.rank} · REAL XP {p.realXp}</Text></View>)}
 </SystemPage>;
}
