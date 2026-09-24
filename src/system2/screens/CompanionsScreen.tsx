import {useEffect,useState} from 'react';
import {Text,View} from 'react-native';
import SystemPage,{pageStyles as s} from '../components/SystemPage';
import Action from '../components/Action';
import {useSystem} from '../state/SystemProvider';
import {availableCompanions} from '../companions/catalog';
import {loadActiveCompanion,saveActiveCompanion} from '../companions/storage';
export default function CompanionsScreen(){
 const {player}=useSystem(),[active,setActive]=useState<string|null>(null);
 useEffect(()=>{void loadActiveCompanion().then(setActive)},[]);
 async function select(id:string){setActive(await saveActiveCompanion(id))}
 const rows=availableCompanions(player.realLevel);
 return <SystemPage title="COMPANIONS" subtitle="NPC // AI ALLIES">
  <View style={s.panel}><Text style={s.label}>COMPANION NETWORK // ACTIVE {active?.toUpperCase()??'NONE'}</Text><Text style={s.title}>SOJUSZNICY SYSTEMU</Text><Text style={s.body}>Aktywny Companion jest warstwą narracji/prezentacji. Nie generuje REAL XP i nie obniża wymagań weryfikacji.</Text></View>
  {rows.map(c=><View key={c.id} style={[s.panel,{opacity:c.unlocked?1:.45}]}><Text style={s.label}>{c.role} // {c.skill}</Text><Text style={s.title}>{c.unlocked?c.name:'SEALED NODE'}</Text><Text style={s.body}>{c.description}</Text><Text style={s.body}>UNLOCK // LV.{c.unlockLevel}</Text>{c.unlocked&&<Action label={active===c.id?'ACTIVE COMPANION ✓':'WYBIERZ COMPANION'} disabled={active===c.id} onPress={()=>void select(c.id)}/>}</View>)}
 </SystemPage>;
}