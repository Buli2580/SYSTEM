import { Text, View } from 'react-native';
import { useSystem } from '../state/SystemProvider';
import SystemPage, { pageStyles as s } from '../components/SystemPage';
import { ACHIEVEMENTS } from '../achievements/catalog';
import { achievementPercent, evaluateAchievementState } from '../achievements/engine';

export default function AchievementsScreen() {
  const { player, achievementState } = useSystem();
  const evaluated = evaluateAchievementState(player, achievementState.achievements).progress;
  const unlocked = Object.values(evaluated).filter(item => item.state === 'UNLOCKED' || item.state === 'CLAIMED').length;
  return <SystemPage title="OSIĄGNIĘCIA" subtitle="SYSTEM ACHIEVEMENTS">
    <View style={s.panel}>
      <Text style={s.label}>PROGRESS</Text>
      <Text style={s.title}>{unlocked} / {ACHIEVEMENTS.length}</Text>
      <Text style={s.body}>Osiągnięcia wynikają wyłącznie z kanonicznego postępu gracza. Ten ekran nie przyznaje XP ani nagród.</Text>
    </View>
    {ACHIEVEMENTS.map(def => {
      const item = evaluated[def.id];
      const complete = item.state === 'UNLOCKED' || item.state === 'CLAIMED';
      return <View key={def.id} style={s.panel} accessibilityRole="summary" accessibilityLabel={def.name + ', ' + item.currentProgress + ' z ' + item.maxProgress}>
        <Text style={s.label}>{def.category} · {def.tier ?? 'COMMON'} · {complete ? 'UNLOCKED' : item.state}</Text>
        <Text style={s.title}>{def.name}</Text>
        <Text style={s.body}>{def.description}</Text>
        <Text style={s.body}>{item.currentProgress.toLocaleString()} / {item.maxProgress.toLocaleString()} · {achievementPercent(item)}%</Text>
        <View accessibilityRole="progressbar" accessibilityValue={{min:0,max:item.maxProgress,now:item.currentProgress}} style={{height:5,backgroundColor:'#17333e',borderRadius:4,marginTop:10}}>
          <View style={{height:5,width: achievementPercent(item) + '%',backgroundColor:'#62efff',borderRadius:4}} />
        </View>
      </View>;
    })}
  </SystemPage>;
}
