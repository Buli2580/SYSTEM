import {Text,View} from 'react-native';
import {useRouter} from 'expo-router';
import SystemPage,{pageStyles as s} from '../components/SystemPage';
import Action from '../components/Action';
const MODULES=[
 ['PARTNER MARKETPLACE','Kategorie przyszłych ofert','/partner-marketplace'],
 ['INVENTORY / ITEMS','Relikty, badge, frame, aura','/inventory'],
 ['PROGRESSION 2.0','Achievements, Titles, Skill Tree','/progression-2'],
 ['BATTLE NETWORK','Guild Wars, PvP, Raid 2.0, Seasons 2.0, Referral','/battle-network'],
 ['COMPANIONS','NPC / Companions','/companions'],
 ['AI STORY DIRECTOR','Dynamiczny kierunek historii','/ai-story'],
 ['PLANNER','Smart Notifications, Calendar, Habits','/planner-2'],
 ['PREMIUM / SPONSORS','Shop bez pay-to-win + Sponsor Challenges','/premium-hub'],
 ['SYSTEM LAB','Anti-cheat 2.0, telemetry, Offline Sync 2.0','/system-lab'],
] as const;
export default function ExpansionHubScreen(){const router=useRouter();return <SystemPage title="SYSTEM EXPANSION" subtitle="NEXT GENERATION MODULES">
 <View style={s.panel}><Text style={s.label}>EXPANSION PACK // ACTIVE DEVELOPMENT</Text><Text style={s.title}>NOWE WARSTWY SYSTEMU</Text><Text style={s.body}>Moduły poniżej są spięte z aktualnym profilem gracza. MOVE camera/pose pozostaje odłożone na później.</Text></View>
 {MODULES.map(([title,body,route])=><View key={title} style={s.panel}><Text style={s.label}>MODULE</Text><Text style={s.title}>{title}</Text><Text style={s.body}>{body}</Text><Action label="OTWÓRZ →" onPress={()=>router.push(route as never)}/></View>)}
 <View style={s.panel}><Text style={s.label}>MOVE NETWORK</Text><Action label="FAMILY 2.0 →" onPress={()=>router.push('/move-family')}/><Action label="SCHOOL 2.0 →" onPress={()=>router.push('/move-school')}/><Action label="WORLD MAP 2.0 →" onPress={()=>router.push('/world')}/></View>
 </SystemPage>}