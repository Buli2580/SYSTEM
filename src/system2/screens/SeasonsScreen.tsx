import {useEffect,useRef,useState} from 'react';import {Text,View} from 'react-native';import SystemPage,{pageStyles as s} from '../components/SystemPage';import Action from '../components/Action';import SystemError from '../components/SystemError';import {getCurrentSeason} from '../cloud/seasons';import type {SocialSeason} from '../social/seasons';
export default function SeasonsScreen(){
 const[season,setSeason]=useState<SocialSeason|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);const epoch=useRef(0),mounted=useRef(true);
 useEffect(()=>()=>{mounted.current=false;epoch.current++;},[]);
 async function load(){const id=++epoch.current;if(mounted.current){setBusy(true);setError(null);setSeason(null);}try{const next=await getCurrentSeason();if(mounted.current&&id===epoch.current)setSeason(next);}catch(e){if(mounted.current&&id===epoch.current)setError(e instanceof Error?e.message:'SEASON_FAILED');}finally{if(mounted.current&&id===epoch.current)setBusy(false);}}
 useEffect(()=>{void load();},[]);
 return <SystemPage title="SEZON" subtitle="SYSTEM ONLINE // CYCLE"><View style={s.panel}><Text style={s.label}>CURRENT SEASON</Text>{season?<><Text style={s.title}>{season.name}</Text><Text style={s.body}>ACTIVE · {season.startsAt.slice(0,10)} → {season.endsAt.slice(0,10)}</Text></>:<Text style={s.title}>{busy?'SPRAWDZANIE…':'BRAK AKTYWNEGO SEZONU'}</Text>}<Action label="ODŚWIEŻ" disabled={busy} onPress={()=>void load()}/></View>{error&&<SystemError message={error} retry={()=>void load()}/>}</SystemPage>;
}
