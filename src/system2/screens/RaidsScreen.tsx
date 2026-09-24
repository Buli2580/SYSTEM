import {useEffect,useRef,useState} from 'react';
import {Text,View} from 'react-native';
import SystemPage,{pageStyles as s} from '../components/SystemPage';
import Action from '../components/Action';
import SystemError from '../components/SystemError';
import BossStatusCard from '../components/BossStatusCard';
import {getActiveRaids,getRaidLeaderboardV3,type CloudRaidLeaderboardRow,type CloudRaidV3} from '../cloud/raids';
import {raidHp} from '../social/raids';
import {raidProgress,raidThreat} from '../social/raidThreat';
import SystemAudioScene from '../components/SystemAudioScene';
import {raid2Phase} from '../social/raid2';
import {triggerBossCinematicState} from '../audio/engine';

function remaining(end:string){
 const ms=Math.max(0,Date.parse(end)-Date.now());
 const d=Math.floor(ms/86400000),h=Math.floor((ms%86400000)/3600000),m=Math.floor((ms%3600000)/60000);
 return d>0?`${d}D ${h}H`:h>0?`${h}H ${m}MIN`:`${m}MIN`;
}
export default function RaidsScreen(){
 const[rows,setRows]=useState<CloudRaidV3[]>([]),[leaderboards,setLeaderboards]=useState<Record<string,CloudRaidLeaderboardRow[]>>({}),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);const epoch=useRef(0),mounted=useRef(true);
 useEffect(()=>()=>{mounted.current=false;epoch.current++;},[]);
 async function load(){const id=++epoch.current;if(mounted.current){setBusy(true);setError(null);setRows([]);}try{const next=await getActiveRaids();const boards=Object.fromEntries(await Promise.all(next.slice(0,5).map(async raid=>[raid.id,await getRaidLeaderboardV3(raid.id,5)] as const)));if(mounted.current&&id===epoch.current){setRows(next);setLeaderboards(boards)}}catch(e){if(mounted.current&&id===epoch.current)setError(e instanceof Error?e.message:'RAIDS_FAILED');}finally{if(mounted.current&&id===epoch.current)setBusy(false);}}
 useEffect(()=>{void load();},[]);
 useEffect(()=>{
   if(!rows.length)return;
   const raid=rows[0],progress=raidProgress(raidHp(raid),raid.bossHp);
   if(progress>=1){triggerBossCinematicState('DEATH');const t=setTimeout(()=>triggerBossCinematicState('VICTORY'),900);return()=>clearTimeout(t)}
   if(progress>=.75)triggerBossCinematicState('ENRAGE');
   else if(progress>=.5)triggerBossCinematicState('PHASE_2');
   else if(progress>=.2)triggerBossCinematicState('ATTACK');
   else triggerBossCinematicState('ROAR');
 },[rows]);
 return <SystemPage title="WORLD RAIDS" subtitle="SYSTEM ONLINE // CO-OP BOSS" intensity="world" screen="BOSS" scene="BOSS_ZONE" threat={3} weather="STORM">
 {rows.length>0&&<SystemAudioScene cue="BOSS" preset="BOSS" />}
 <View style={s.panel}><Text style={[s.label,{color:'#e4baff'}]}>RAID 2.0 // GLOBAL THREAT NETWORK</Text><Text style={s.title}>{rows.length?'RAID SIGNAL DETECTED':busy?'SCANNING NETWORK':'SECTOR QUIET'}</Text><Text style={s.body}>Zweryfikowany progres graczy zasila wspólny damage. Raid nie przyznaje lokalnie XP — wynik rozlicza warstwa online.</Text><Action label={busy?'SYNCHRONIZACJA…':'ODŚWIEŻ SYGNAŁ'} disabled={busy} onPress={()=>void load()}/></View>
 {error&&<SystemError message={error} retry={()=>void load()}/>}
 {!error&&!busy&&rows.length===0&&<View style={s.panel}><Text style={s.label}>NO ACTIVE TARGET</Text><Text style={s.body}>SYSTEM nie wykrywa teraz aktywnego globalnego bossa.</Text></View>}
 {rows.map(r=>{const hp=raidHp(r),progress=Math.round(raidProgress(hp,r.bossHp)*100),threat=raidThreat(hp,r.bossHp),phase=raid2Phase(r);return <View key={r.id} style={s.panel}>
   <Text style={[s.label,{color:threat==='CRITICAL'?'#ffcf6a':'#e4baff'}]}>RAID 2.0 // {phase} // THREAT {threat}</Text>
   <BossStatusCard title={r.title} status={r.status} hp={hp} maxHp={r.bossHp}/>
   <Text style={s.body}>GLOBAL DAMAGE: {r.damage.toLocaleString()} · PROGRESS {progress}% · TIME LEFT {remaining(r.endsAt)}</Text><Text style={s.body}>PHASE // {phase} · contribution rank będzie liczony wyłącznie ze zweryfikowanych zdarzeń online.</Text>
   <View style={{height:6,borderRadius:6,overflow:'hidden',backgroundColor:'#17333e',marginTop:9}}><View style={{height:'100%',width:`${Math.max(2,progress)}%`,backgroundColor:'#e4baff'}}/></View>
   <Text style={s.body}>PARTICIPANTS {r.participantCount} · YOUR DAMAGE {r.myDamage} · YOUR EVENTS {r.myEventCount} · YOUR RANK {r.myRank||'—'}</Text>
   {(leaderboards[r.id]??[]).length>0&&<View style={{marginTop:10}}><Text style={s.label}>RAID LEADERBOARD // TOP 5</Text>{(leaderboards[r.id]??[]).map(row=><Text key={row.userId} style={s.body}>#{row.rank} {row.displayName} · DMG {row.damage} · {row.verifiedEvents} EVENTS</Text>)}</View>}
 </View>;})}
 </SystemPage>;
}
