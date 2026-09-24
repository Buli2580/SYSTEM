import {Text,View} from 'react-native';
import {useRouter} from 'expo-router';
import SystemPage,{pageStyles as s} from '../components/SystemPage';
import Action from '../components/Action';
import {useSystem} from '../state/SystemProvider';
import {directStory} from '../story/director2';
export default function AIStoryDirectorScreen(){const x=useSystem(),router=useRouter();const d=directStory(x.player,{bossHp:x.story?.bossHp,worldUnlocked:x.worldUnlocked,failed:x.failedQuestIds?.length??0,streak:x.player.streak});const route=d.next==='BOSS'?'/story':d.next==='WORLD'?'/world':d.next==='RECOVERY'?'/quests':'/quests';return <SystemPage title="AI STORY DIRECTOR" subtitle="NARRATIVE ENGINE 2.0">
 <View style={s.panel}><Text style={s.label}>{d.chapter} // THREAT {d.threat}</Text><Text style={s.title}>{d.headline}</Text><Text style={s.body}>{d.message}</Text><Action label={'NEXT // '+d.next+' →'} onPress={()=>router.push(route as never)}/></View>
 <View style={s.panel}><Text style={s.label}>CANONICAL RULE</Text><Text style={s.body}>Director może zmieniać kierunek narracji i prezentację, ale nie przyznaje XP i nie omija weryfikacji questów.</Text></View>
 </SystemPage>}