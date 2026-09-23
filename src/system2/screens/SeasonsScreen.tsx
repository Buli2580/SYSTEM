import {useEffect,useRef,useState} from 'react';
import {Text,View} from 'react-native';
import SystemPage,{pageStyles as s} from '../components/SystemPage';
import Action from '../components/Action';
import SystemError from '../components/SystemError';
import {getCurrentSeason} from '../cloud/seasons';
import type {SocialSeason} from '../social/seasons';
import {seasonProgress,seasonCountdown} from '../social/seasonPresentation';

function remaining(ms:number){
 const d=Math.floor(ms/86400000),h=Math.floor((ms%86400000)/3600000);
 return d>0?`${d}D ${h}H`:`${h}H`;
}
export default function SeasonsScreen(){
 const[season,setSeason]=useState<SocialSeason|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);const epoch=useRef(0),mounted=useRef(true);
 useEffect(()=>()=>{mounted.current=false;epoch.current++;},[]);
 async function load(){const id=++epoch.current;if(mounted.current){setBusy(true);setError(null);setSeason(null);}try{const next=await getCurrentSeason();if(mounted.current&&id===epoch.current)setSeason(next);}catch(e){if(mounted.current&&id===epoch.current)setError(e instanceof Error?e.message:'SEASON_FAILED');}finally{if(mounted.current&&id===epoch.current)setBusy(false);}}
 useEffect(()=>{void load();},[]);
 const now=Date.now(),progress=season?seasonProgress(now,Date.parse(season.startsAt),Date.parse(season.endsAt)):0,countdown=season?seasonCountdown(now,Date.parse(season.endsAt)):0;
 return <SystemPage title="SEZON" subtitle="SYSTEM ONLINE // CYCLE">
  <View style={s.panel}><Text style={s.label}>SEASON 2.0 // CURRENT CYCLE</Text>{season?<>
   <Text style={s.title}>{season.name}</Text>
   <Text style={s.body}>ACTIVE · {season.startsAt.slice(0,10)} → {season.endsAt.slice(0,10)}</Text>
   <Text style={s.label}>SEASON TIME PROGRESS // {Math.round(progress*100)}%</Text>
   <View style={{height:6,borderRadius:6,overflow:'hidden',backgroundColor:'#17333e',marginTop:10}}><View style={{height:'100%',width:`${Math.max(2,Math.round(progress*100))}%`,backgroundColor:'#6ceeff'}}/></View>
   <Text style={s.body}>DO KOŃCA: {remaining(countdown)}</Text>
   <Text style={s.body}>Reward Track, Season XP, weekly season quests i historyczne badges są następną warstwą backendową — ekran nie pokazuje fikcyjnych punktów, których chmura jeszcze nie zwraca.</Text>
  </>:<Text style={s.title}>{busy?'SPRAWDZANIE…':'BRAK AKTYWNEGO SEZONU'}</Text>}<Action label="ODŚWIEŻ" disabled={busy} onPress={()=>void load()}/></View>
  {error&&<SystemError message={error} retry={()=>void load()}/>}
 </SystemPage>;
}
