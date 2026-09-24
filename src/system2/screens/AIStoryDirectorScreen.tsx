import {useEffect,useState} from 'react';
import {Text,View} from 'react-native';
import {useRouter} from 'expo-router';
import SystemPage,{pageStyles as s} from '../components/SystemPage';
import Action from '../components/Action';
import {useSystem} from '../state/SystemProvider';
import {directStory,type StoryDirective} from '../story/director2';
import {requestAIStoryDirector,type AIStoryDirective} from '../ai/story';

export default function AIStoryDirectorScreen(){
 const x=useSystem(),router=useRouter();
 const input={bossHp:x.story?.bossHp,worldUnlocked:x.worldUnlocked,failed:x.failedQuestIds?.length??0,streak:x.player.streak};
 const fallback:AIStoryDirective={...directStory(x.player,input),source:'fallback'};
 const[d,setD]=useState<AIStoryDirective>(fallback),[busy,setBusy]=useState(false);
 async function refresh(){setBusy(true);try{setD(await requestAIStoryDirector(x.player,input));}finally{setBusy(false)}}
 useEffect(()=>{void refresh()},[x.player.id,x.player.realLevel,x.player.streak,x.story?.bossHp,x.worldUnlocked,x.failedQuestIds?.length]);
 const route=d.next==='BOSS'?'/story':d.next==='WORLD'?'/world':'/quests';
 return <SystemPage title="AI STORY DIRECTOR" subtitle="NARRATIVE ENGINE 2.0" screen="LAUNCH" scene="PORTAL" threat={2} weather="FOG" intensity="hero">
  <View style={s.panel}><Text style={s.label}>{d.source==='ai'?'AI ONLINE':'SAFE FALLBACK'} // {d.chapter} // THREAT {d.threat}</Text><Text style={s.title}>{d.headline}</Text><Text style={s.body}>{d.message}</Text>{d.model&&<Text style={s.body}>MODEL // {d.model}</Text>}<Action label={busy?'DIRECTOR THINKING…':'ODŚWIEŻ STORY DIRECTOR'} disabled={busy} onPress={()=>void refresh()}/><Action label={'NEXT // '+d.next+' →'} onPress={()=>router.push(route as never)}/></View>
  <View style={s.panel}><Text style={s.label}>CANONICAL RULE</Text><Text style={s.body}>AI może prowadzić narrację i wybierać kierunek następnego rozdziału, ale nie może przyznać XP, ominąć weryfikacji ani tworzyć kary za niepowodzenie.</Text></View>
 </SystemPage>;
}