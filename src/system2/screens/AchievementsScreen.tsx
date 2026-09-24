import SystemError from '../components/SystemError';
import { useMemo } from 'react';
import { Text, View, type DimensionValue } from 'react-native';
import { useSystem } from '../state/SystemProvider';
import SystemPage, { pageStyles as s } from '../components/SystemPage';
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES } from '../achievements/catalog';
import { achievementPercent, evaluateAchievementState } from '../achievements/engine';
import {achievementMastery,achievementMomentum} from '../achievements/v2';

export default function AchievementsScreen() {
  const { player, achievementState, achievementError, refreshAchievements } = useSystem();
  const evaluated = useMemo(() => ({ ...evaluateAchievementState(player, achievementState.achievements).progress, ...achievementState.achievements }), [player,achievementState]);
  const visible=ACHIEVEMENTS.filter(def => !def.hideUntilUnlock || ['UNLOCKED','CLAIMED'].includes(evaluated[def.id].state));
  const categories = Object.keys(ACHIEVEMENT_CATEGORIES).sort((a,b) => ACHIEVEMENT_CATEGORIES[a].order - ACHIEVEMENT_CATEGORIES[b].order);
  const unlocked = Object.values(evaluated).filter(item => item.state === 'UNLOCKED' || item.state === 'CLAIMED').length;
  const mastery=achievementMastery(player,unlocked,ACHIEVEMENTS.length),momentum=achievementMomentum(unlocked,ACHIEVEMENTS.length,player.streak);
  return <SystemPage title="OSIĄGNIĘCIA" subtitle="SYSTEM ACHIEVEMENTS 2.0" screen="CHARACTER" scene="PORTAL" threat={1} intensity="hero">
    {achievementError && <SystemError message={achievementError} retry={() => { void refreshAchievements(); }} />}
    <View style={s.panel}><Text style={s.label}>MASTERY // {momentum.signal}</Text><Text style={s.title}>{mastery.tier} // {mastery.score}</Text><Text style={s.body}>{momentum.percent}% katalogu · następny mastery threshold {mastery.nextScore}</Text></View>
    <View style={s.panel}><Text style={s.label}>PROGRESS</Text><Text style={s.title}>{unlocked} / {ACHIEVEMENTS.length}</Text>
      <Text style={s.body}>Postęp jest wyliczany z kanonicznych danych gracza. Sam ekran nie przyznaje XP ani nie zmienia questów.</Text></View>
    {categories.map(category => { const items=visible.filter(def => def.category === category); if(!items.length) return null; const meta=ACHIEVEMENT_CATEGORIES[category]; const categoryUnlocked=items.filter(def => ['UNLOCKED','CLAIMED'].includes(evaluated[def.id].state)).length; return <View key={category}>
      <View style={s.panel}><Text style={s.label}>{meta.icon} {meta.name}</Text><Text style={s.body}>{categoryUnlocked} / {items.length} UNLOCKED</Text></View>
      {items.map(def => { const item=evaluated[def.id], complete=['UNLOCKED','CLAIMED'].includes(item.state), pct=achievementPercent(item); return <View key={def.id} style={s.panel} accessibilityRole="summary" accessibilityLabel={def.name+', '+item.currentProgress+' z '+item.maxProgress}>
        <Text style={s.label}>{def.tier ?? 'COMMON'} · {complete?'UNLOCKED':item.state}</Text><Text style={s.title}>{def.name}</Text><Text style={s.body}>{def.description}</Text>
        <Text style={s.body}>{item.currentProgress.toLocaleString()} / {item.maxProgress.toLocaleString()} · {pct}%</Text>
        <View accessibilityRole="progressbar" accessibilityValue={{min:0,max:item.maxProgress,now:Math.min(item.currentProgress,item.maxProgress)}} style={{height:5,backgroundColor:'#17333e',borderRadius:4,marginTop:10}}><View style={{height:5,width: `${pct}%` as DimensionValue,backgroundColor:'#62efff',borderRadius:4}} /></View>
      </View>; })}
    </View>; })}
  </SystemPage>;
}
