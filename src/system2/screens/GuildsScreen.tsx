import {useEffect,useRef,useState} from 'react';
import {Text,View} from 'react-native';
import SystemPage,{pageStyles as s} from '../components/SystemPage';
import Action from '../components/Action';
import SystemError from '../components/SystemError';
import {listGuilds,joinGuild} from '../cloud/guilds';
import type {Guild} from '../social/guilds';
import GuildCard from '../components/GuildCard';

export default function GuildsScreen(){
 const[rows,setRows]=useState<Guild[]>([]);
 const[busy,setBusy]=useState(true),[loaded,setLoaded]=useState(false),[error,setError]=useState<string|null>(null);
 const lock=useRef(false),mounted=useRef(true),epoch=useRef(0);
 useEffect(()=>{void refresh();return()=>{mounted.current=false;epoch.current++;};},[]);

 async function fetchRows(id:number){const next=await listGuilds();if(mounted.current&&id===epoch.current){setRows(next);setLoaded(true);}}
 async function refresh(){
  if(lock.current)return;lock.current=true;const id=++epoch.current;
  if(mounted.current){setBusy(true);setError(null);setRows([]);}
  try{await fetchRows(id);}catch(e){if(mounted.current&&id===epoch.current){setLoaded(true);setError(e instanceof Error?e.message:'GUILDS_FAILED');}}
  finally{lock.current=false;if(mounted.current&&id===epoch.current)setBusy(false);}
 }
 async function join(id:string){
  if(lock.current)return;lock.current=true;const request=++epoch.current;
  if(mounted.current){setBusy(true);setError(null);}
  try{await joinGuild(id);await fetchRows(request);}
  catch(e){if(mounted.current&&request===epoch.current)setError(e instanceof Error?e.message:'JOIN_FAILED');}
  finally{lock.current=false;if(mounted.current&&request===epoch.current)setBusy(false);}
 }

 return <SystemPage title="GILDIE" subtitle="SYSTEM ONLINE // TEAMS">
  <View style={s.panel}><Text style={s.label}>GUILD NETWORK</Text><Text style={s.body}>Znajdź ekipę, buduj wspólne XP i przygotuj się do raidów.</Text><Action label={busy?'ŁADOWANIE…':'ODŚWIEŻ'} disabled={busy} onPress={()=>void refresh()}/></View>
  {error&&<SystemError message={error} retry={()=>void refresh()}/>}
  {!error&&loaded&&!busy&&rows.length===0&&<View style={s.panel}><Text style={s.title}>BRAK PUBLICZNYCH GILDII</Text></View>}
  {rows.map(g=><GuildCard key={g.id} guild={g} busy={busy} onJoin={()=>{void join(g.id);}}/> )}
 </SystemPage>;
}
