import {useEffect,useRef,useState} from 'react';
import {Text,View} from 'react-native';
import SystemPage,{pageStyles as s} from '../components/SystemPage';
import Action from '../components/Action';
import SystemError from '../components/SystemError';
import {getCurrentSeasonV2,type SeasonV2Snapshot} from '../cloud/seasons';
import {seasonProgress,seasonCountdown} from '../social/seasonPresentation';
import SeasonCycleCard from '../components/SeasonCycleCard';
import {SEASON_TRACK,seasonProgress2} from '../social/season2';

function remaining(ms:number){
 const d=Math.floor(ms/86400000),h=Math.floor((ms%86400000)/3600000);
 return d>0?`${d}D ${h}H`:`${h}H`;
}
export default function SeasonsScreen(){
 const[season,setSeason]=useState<SeasonV2Snapshot|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);const epoch=useRef(0),mounted=useRef(true);
 useEffect(()=>()=>{mounted.current=false;epoch.current++;},[]);
 async function load(){const id=++epoch.current;if(mounted.current){setBusy(true);setError(null);setSeason(null);}try{const next=await getCurrentSeasonV2();if(mounted.current&&id===epoch.current)setSeason(next);}catch(e){if(mounted.current&&id===epoch.current)setError(e instanceof Error?e.message:'SEASON_FAILED');}finally{if(mounted.current&&id===epoch.current)setBusy(false);}}
 useEffect(()=>{void load();},[]);
 const now=Date.now(),progress=season?seasonProgress(now,Date.parse(season.startsAt),Date.parse(season.endsAt)):0,countdown=season?seasonCountdown(now,Date.parse(season.endsAt)):0;
 const season2=season?seasonProgress2(season,now):null;
 return <SystemPage title="SEZON" subtitle="SYSTEM ONLINE // CYCLE">
  <View style={s.panel}><Text style={s.label}>SEASON 2.1 // CURRENT CYCLE</Text>{season
   ? <SeasonCycleCard season={season} progress={progress} countdown={countdown}/>
   : <Text style={s.title}>{busy?'SPRAWDZANIE…':'BRAK AKTYWNEGO SEZONU'}</Text>}
   <Action label="ODŚWIEŻ" disabled={busy} onPress={()=>void load()}/>
  </View>
  {season2&&season&&<View style={s.panel}><Text style={s.label}>SEASON 2.0 // TIME {season2.percent}%</Text><Text style={s.title}>TRACK LV.{season.trackLevel} // {season.seasonPoints} PTS</Text><Text style={s.body}>{season.verifiedEvents} verified events · sezon nie sprzedaje REAL XP. Track zawiera wyłącznie kosmetykę, tytuły i ramki.</Text>{SEASON_TRACK.map(item=>{const open=season.trackLevel>=item.level;return <Text key={item.level} style={[s.body,{opacity:open?1:.45}]}>{open?'◆':'◇'} LV.{item.level} · {item.kind} · {item.name}</Text>})}</View>}
  {error&&<SystemError message={error} retry={()=>void load()}/>}
 </SystemPage>;
}
