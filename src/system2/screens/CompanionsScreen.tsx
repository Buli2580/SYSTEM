import {Text,View} from 'react-native';
import SystemPage,{pageStyles as s} from '../components/SystemPage';
import {useSystem} from '../state/SystemProvider';
import {availableCompanions} from '../companions/catalog';
export default function CompanionsScreen(){const {player}=useSystem();return <SystemPage title="COMPANIONS" subtitle="NPC // AI ALLIES">
 <View style={s.panel}><Text style={s.label}>COMPANION NETWORK</Text><Text style={s.title}>SOJUSZNICY SYSTEMU</Text><Text style={s.body}>Towarzysze są warstwą fabularną i prezentacyjną. Nie produkują darmowego XP.</Text></View>
 {availableCompanions(player.realLevel).map(c=><View key={c.id} style={[s.panel,{opacity:c.unlocked?1:.45}]}><Text style={s.label}>{c.role} // {c.skill}</Text><Text style={s.title}>{c.unlocked?c.name:'SEALED NODE'}</Text><Text style={s.body}>{c.description}</Text><Text style={s.body}>UNLOCK // LV.{c.unlockLevel}</Text></View>)}
 </SystemPage>}