import {Text,View} from 'react-native';
import SystemPage,{pageStyles as s} from '../components/SystemPage';
import {useSystem} from '../state/SystemProvider';
import {ACHIEVEMENTS} from '../achievements/catalog';
import {achievementMastery,achievementMomentum} from '../achievements/v2';
import {unlockedTitles2,TITLE_CATALOG_2} from '../progression/titles2';
import {skillTreeState} from '../progression/skillTree2';
export default function Progression2Screen(){const x=useSystem();const unlocked=Object.values(x.achievementState.achievements).filter((a:any)=>a.state==='UNLOCKED'||a.state==='CLAIMED').length;const mastery=achievementMastery(x.player,unlocked,ACHIEVEMENTS.length),momentum=achievementMomentum(unlocked,ACHIEVEMENTS.length,x.player.streak);const titles=unlockedTitles2(x.player.realLevel,x.player.streak,!!x.story?.bossComplete,x.awakeningCompleted);return <SystemPage title="PROGRESSION 2.0" subtitle="ACHIEVEMENTS // TITLES // SKILL TREE">
 <View style={s.panel}><Text style={s.label}>ACHIEVEMENT MASTERY // {momentum.signal}</Text><Text style={s.title}>{mastery.tier} // {mastery.score}</Text><Text style={s.body}>{momentum.percent}% katalogu osiągnięć · następny próg {mastery.nextScore}</Text></View>
 <View style={s.panel}><Text style={s.label}>TITLES 2.0</Text><Text style={s.title}>{titles.length} / {TITLE_CATALOG_2.length} ODBLOKOWANE</Text>{TITLE_CATALOG_2.map(t=><Text key={t.id} style={s.body}>{titles.some(x=>x.id===t.id)?'◆':'◇'} {t.name} // {t.rarity} // {t.requirement}</Text>)}</View>
 <View style={s.panel}><Text style={s.label}>SKILL TREE 2.0</Text>{skillTreeState(x.player).map(({node,unlocked,level})=><View key={node.id} style={{marginTop:10,opacity:unlocked?1:.5}}><Text style={s.title}>{unlocked?'◆':'◇'} {node.name}</Text><Text style={s.body}>{node.skill} LV.{level} // wymaga LV.{node.level} · {node.effect}</Text></View>)}</View>
 </SystemPage>}