import {useEffect,useRef,useState} from 'react';
import {Text,View} from 'react-native';
import SystemPage,{pageStyles as s} from '../components/SystemPage';
import Action from '../components/Action';
import SystemError from '../components/SystemError';
import BossStatusCard from '../components/BossStatusCard';
import {getActiveRaids} from '../cloud/raids';
import {raidHp,type SocialRaid} from '../social/raids';
import {raidProgress,raidThreat} from '../social/raidThreat';

function remaining(end:string){
 const ms=Math.max(0,Date.parse(end)-Date.now());
 const d=Math.floor(ms/86400000),h=Math.floor((ms%86400000)/3600000),m=Math.floor((ms%3600000)/60000);
 return d>0?`${d}D ${h}H`:h>0?`${h}H ${m}MIN`:`${m}MIN`;
}
export default function RaidsScreen(){
 const[rows,setRows]=useState<SocialRaid[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);const epoch=useRef(0),mounted=useRef(true);
 useEffect(()=>()=>{mounted.current=false;epoch.current++;},[]);
 async function load(){const id=++epoch.current;if(mounted.current){setBusy(true);setError(null);setRows([]);}try{const next=await getActiveRaids();if(mounted.current&&id===epoch.current)setRows(next);}catch(e){if(mounted.current&&id===epoch.current)setError(e instanceof Error?e.message:'RAIDS_FAILED');}finally{if(mounted.current&&id===epoch.current)setBusy(false);}}
 useEffect(()=>{void load();},[]);
 return <SystemPage title="WORLD RAIDS" subtitle="SYSTEM ONLINE // CO-OP BOSS" intensity="world">
 <View style={s.panel}><Text style={[s.label,{color:'#e4baff'}]}>RAID 2.0 // GLOBAL THREAT NETWORK</Text><Text style={s.title}>{rows.length?'RAID SIGNAL DETECTED':busy?'SCANNING NETWORK':'SECTOR QUIET'}</Text><Text style={s.body}>Zweryfikowany progres graczy zasila wspólny damage. Raid nie przyznaje lokalnie XP — wynik rozlicza warstwa online.</Text><Action label={busy?'SYNCHRONIZACJA…':'ODŚWIEŻ SYGNAŁ'} disabled={busy} onPress={()=>void load()}/></View>
 {error&&<SystemError message={error} retry={()=>void load()}/>}
 {!error&&!busy&&rows.length===0&&<View style={s.panel}><Text style={s.label}>NO ACTIVE TARGET</Text><Text style={s.body}>SYSTEM nie wykrywa teraz aktywnego globalnego bossa.</Text></View>}
 {rows.map(r=>{const hp=raidHp(r),progress=Math.round(raidProgress(hp,r.bossHp)*100),threat=raidThreat(hp,r.bossHp);return <View key={r.id} style={s.panel}>
   <Text style={[s.label,{color:threat==='CRITICAL'?'#ffcf6a':'#e4baff'}]}>RAID THREAT // {threat}</Text>
   <BossStatusCard title={r.title} status={r.status} hp={hp} maxHp={r.bossHp}/>
   <Text style={s.body}>GLOBAL DAMAGE: {r.damage.toLocaleString()} · PROGRESS {progress}% · TIME LEFT {remaining(r.endsAt)}</Text>
   <View style={{height:6,borderRadius:6,overflow:'hidden',backgroundColor:'#17333e',marginTop:9}}><View style={{height:'100%',width:`${Math.max(2,progress)}%`,backgroundColor:'#e4baff'}}/></View>
   <Text style={s.body}>Participants, contribution leaderboard, raid phases i reward screen wymagają rozszerzenia danych zwracanych przez backend. Ten ekran nie tworzy fikcyjnych uczestników.</Text>
 </View>;})}
 </SystemPage>;
}
