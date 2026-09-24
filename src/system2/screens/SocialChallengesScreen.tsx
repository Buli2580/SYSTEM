import {useEffect,useRef,useState} from 'react';
import {Text,View} from 'react-native';
import SystemPage,{pageStyles as s} from '../components/SystemPage';
import Action from '../components/Action';
import SystemError from '../components/SystemError';
import {getSocialChallenges,getChallengeProgress} from '../cloud/challenges';
import {challengePercent,type SocialChallenge,type ChallengeProgress} from '../social/challenges';
type Row={challenge:SocialChallenge;progress?:ChallengeProgress};

export default function SocialChallengesScreen(){
 const[rows,setRows]=useState<Row[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);const epoch=useRef(0),mounted=useRef(true);
 useEffect(()=>()=>{mounted.current=false;epoch.current++;},[]);
 async function load(){
  const id=++epoch.current;if(mounted.current){setBusy(true);setError(null);setRows([]);}
  try{
   const cs=await getSocialChallenges();
   const ps=await Promise.all(cs.map(c=>getChallengeProgress(c.id)));
   if(mounted.current&&id===epoch.current)setRows(cs.map((challenge,i)=>({challenge,progress:ps[i][0]})));
  }catch(e){if(mounted.current&&id===epoch.current)setError(e instanceof Error?e.message:'CHALLENGES_FAILED');}
  finally{if(mounted.current&&id===epoch.current)setBusy(false);}
 }
 useEffect(()=>{void load();},[]);
 return <SystemPage title="WYZWANIA" subtitle="SYSTEM ONLINE // COMPETE" screen="QUESTS" scene="RUINS" threat={2} weather="RAIN" intensity="hero"><View style={s.panel}><Text style={s.label}>ACTIVE CHALLENGES</Text><Text style={s.body}>Rywalizacja oparta o questy, XP, dystans i streak.</Text><Action label="ODŚWIEŻ" disabled={busy} onPress={()=>void load()}/></View>{error&&<SystemError message={error} retry={()=>void load()}/>} {!error&&!busy&&rows.length===0&&<View style={s.panel}><Text style={s.title}>BRAK AKTYWNYCH WYZWAŃ</Text></View>}{rows.map(({challenge:c,progress:p})=><View key={c.id} style={s.panel}><Text style={s.label}>{c.metric} · ACTIVE</Text><Text style={s.title}>{c.title}</Text><Text style={s.body}>{p?.value??0} / {c.target} · {challengePercent(c,p).toFixed(0)}%</Text></View>)}</SystemPage>;
}
