import {useEffect,useState} from 'react';
import {Text,View} from 'react-native';
import SystemPage,{pageStyles as s} from '../components/SystemPage';
import Action from '../components/Action';
import SystemError from '../components/SystemError';
import {useSystem} from '../state/SystemProvider';
import {ACHIEVEMENTS,TITLES} from '../achievements/catalog';
import {achievementMastery,achievementMomentum} from '../achievements/v2';
import {skillTreeState} from '../progression/skillTree2';
import {setActiveTitle} from '../achievements/storage';
import {activateSkillNode,loadActiveSkillNodes,type ActiveSkillNodes} from '../progression/skillTreeStorage';

export default function Progression2Screen(){
 const x=useSystem();
 const[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null),[activeNodes,setActiveNodes]=useState<ActiveSkillNodes>({});
 useEffect(()=>{void loadActiveSkillNodes().then(setActiveNodes)},[]);
 const unlocked=Object.values(x.achievementState.achievements).filter((a:any)=>a.state==='UNLOCKED'||a.state==='CLAIMED').length;
 const mastery=achievementMastery(x.player,unlocked,ACHIEVEMENTS.length),momentum=achievementMomentum(unlocked,ACHIEVEMENTS.length,x.player.streak);
 const titleRows=TITLES.map(t=>({def:t,state:x.achievementState.titles.titles[t.id]}));
 const titleCount=titleRows.filter(x=>x.def.isDefault||x.state?.unlocked).length;
 async function activate(id:string){setBusy(true);setError(null);try{await setActiveTitle(id);await x.refreshAchievements();}catch(e){setError(e instanceof Error?e.message:'Nie udało się ustawić tytułu.')}finally{setBusy(false)}}
 async function activateNode(skill:keyof ActiveSkillNodes,id:string,level:number){setBusy(true);setError(null);try{setActiveNodes(await activateSkillNode(skill,id,level));}catch(e){setError(e instanceof Error?e.message:'Nie udało się aktywować węzła.')}finally{setBusy(false)}}
 return <SystemPage title="PROGRESSION 2.0" subtitle="ACHIEVEMENTS // TITLES // SKILL TREE">
  {error&&<SystemError message={error} retry={()=>setError(null)} actionLabel="ZAMKNIJ"/>}
  <View style={s.panel}><Text style={s.label}>ACHIEVEMENT MASTERY // {momentum.signal}</Text><Text style={s.title}>{mastery.tier} // {mastery.score}</Text><Text style={s.body}>{momentum.percent}% katalogu osiągnięć · następny próg {mastery.nextScore}</Text></View>
  <View style={s.panel}><Text style={s.label}>TITLES 2.0 // ACTIVE {x.achievementState.titles.activeTitleId??'DEFAULT'}</Text><Text style={s.title}>{titleCount} / {TITLES.length} ODBLOKOWANE</Text>
   {titleRows.map(({def,state})=>{const open=!!def.isDefault||!!state?.unlocked,active=x.achievementState.titles.activeTitleId===def.id;return <View key={def.id} style={{marginTop:12,opacity:open?1:.45}}><Text style={s.title}>{active?'◆':open?'◇':'◈'} {def.name}</Text><Text style={s.body}>{def.description}</Text>{open&&!def.isDefault&&<Action label={active?'AKTYWNY TYTUŁ ✓':'USTAW AKTYWNY TYTUŁ'} disabled={busy||active} onPress={()=>void activate(def.id)}/>}</View>})}
  </View>
  <View style={s.panel}><Text style={s.label}>SKILL TREE 2.0 // ACTIVE NODES</Text><Text style={s.body}>Węzły zmieniają profil/prezentację i kierunek rekomendacji; nie tworzą darmowego REAL XP.</Text>{skillTreeState(x.player).map(({node,unlocked,level})=>{const active=activeNodes[node.skill]===node.id;return <View key={node.id} style={{marginTop:10,opacity:unlocked?1:.5}}><Text style={s.title}>{active?'◆':unlocked?'◇':'◈'} {node.name}</Text><Text style={s.body}>{node.skill} LV.{level} // wymaga LV.{node.level} · {node.effect}</Text>{unlocked&&<Action label={active?'ACTIVE NODE ✓':'AKTYWUJ WĘZEŁ'} disabled={busy||active} onPress={()=>void activateNode(node.skill,node.id,level)}/>}</View>})}</View>
 </SystemPage>;
}