import {useCallback,useRef,useState} from 'react';
import {Text,View} from 'react-native';
import {useFocusEffect} from 'expo-router';
import SystemPage,{pageStyles as s} from '../components/SystemPage';
import Action from '../components/Action';
import SystemError from '../components/SystemError';
import {useSystem} from '../state/SystemProvider';
import {loadTracebook} from '../storage/database';
import {awaitWithTimeout} from '../storage/awaitWithTimeout';
import type {TraceCategory,TraceEntry} from '../inventory/tracebook';
import {filterTracebook} from '../inventory/tracebook';
const filters:('ALL'|TraceCategory)[]=['ALL','QUEST','DAILY','WEEKLY','BOSS','AWAKENING','LEVEL','DOMAIN','LOOT','PROGRESSION'];
export default function TracebookScreen(){
 const {player}=useSystem();
 const [rows,setRows]=useState<TraceEntry[]>([]),[error,setError]=useState<string|null>(null),[loading,setLoading]=useState(true);
 const [filter,setFilter]=useState<'ALL'|TraceCategory>('ALL'),[visible,setVisible]=useState(40);
 const request=useRef(0);
 const load=useCallback(async()=>{
  const id=++request.current;setLoading(true);setError(null);setRows([]);
  try{const result=await awaitWithTimeout(loadTracebook());if(id===request.current&&result.playerId===player.id)setRows(result.entries);}
  catch(e){if(id===request.current)setError(e instanceof Error?e.message:'Nie udało się odczytać kroniki.');}
  finally{if(id===request.current)setLoading(false);}
 },[player.id]);
 useFocusEffect(useCallback(()=>{void load();return()=>{request.current++;};},[load]));
 const selected=filterTracebook(rows,player.id,filter);
 return <SystemPage title="TRACEBOOK" subtitle={`${player.displayName} // KRONIKA BOHATERA`}>
  <Text style={s.body}>Twoje zapisane czyny, zdobyte wyposażenie i rozwój azylu. Brakujące daty i dawne awanse nie są odgadywane.</Text>
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>{filters.map(category=><Action key={category} label={(category===filter?'✓ ':'')+category} onPress={()=>{setFilter(category);setVisible(40);}}/>)}</View>
  {error?<SystemError message={error} retry={()=>void load()}/>:loading?<Text style={s.body}>ODCZYTYWANIE KRONIKI…</Text>:!selected.length?<Text style={s.body}>Brak zapisanych wydarzeń w tej kategorii.</Text>:selected.slice(0,visible).map(row=><View key={row.id} style={s.panel}><Text style={s.label}>{row.category} · {new Date(row.at).toLocaleString()}</Text><Text style={s.title}>{row.title}</Text><Text style={s.body}>{row.detail}</Text></View>)}
  {selected.length>visible&&<Action label="WCZEŚNIEJSZE WYDARZENIA" onPress={()=>setVisible(n=>n+40)}/>}
 </SystemPage>;
}
