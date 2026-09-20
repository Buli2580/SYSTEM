import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useSystem } from '../state/SystemProvider';
import SystemPage, { pageStyles as s } from '../components/SystemPage';
import SystemError from '../components/SystemError';
import { ACHIEVEMENTS } from '../achievements/catalog';
import { achievementPercent, evaluateAchievementState } from '../achievements/engine';
import { reconcileAchievements } from '../achievements/reconcile';

export default function AchievementsScreen() {
  const { player, achievementState, refreshAchievements } = useSystem();
  const [error,setError]=useState<string|null>(null);
  useEffect(() => {
    let active=true;
    void reconcileAchievements(player).then(() => refreshAchievements()).catch(cause => {
      if(active) setError(cause instanceof Error ? cause.message : 'Nie udało się odświeżyć osiągnięć.');
    });
    return () => { active=false; };
  }, [player.id, player.realLevel, player.totalRealXp, player.streak, player.verifiedQuestCount, player.discoveredSectors, player.totalDistanceMeters, refreshAchievements]);
  const evaluated = useMemo(() => evaluateAchievementState(player, achievementState.achievements).progress, [player,achievementState]);
  const visible=ACHIEVEMENTS.filter(def => !def.hideUntilUnlock || ['UNLOCKED','CLAIMED'].includes(evaluated[def.id].state));
  const unlocked = Object.values(evaluated).filter(item => item.state === 'UNLOCKED' || item.state === 'CLAIMED').length;
  return <SystemPage title="OSIĄGNIĘCIA" subtitle="SYSTEM ACHIEVEMENTS">
    <View style={s.panel}><Text style={s.label}>PROGRESS</Text><Text style={s.title}>{unlocked} / {ACHIEVEMENTS.length}</Text>
      <Text style={s.body}>Postęp jest wyliczany z kanonicznych danych gracza. Sam ekran nie przyznaje XP ani nie zmienia questów.</Text></View>
    {error && <SystemError message={error} retry={() => setError(null)} />}
    {visible.map(def => { const item=evaluated[def.id], complete=['UNLOCKED','CLAIMED'].includes(item.state), pct=achievementPercent(item); return <View key={def.id} style={s.panel} accessibilityRole="summary" accessibilityLabel={def.name+', '+item.currentProgress+' z '+item.maxProgress}>
      <Text style={s.label}>{def.category} · {def.tier ?? 'COMMON'} · {complete?'UNLOCKED':item.state}</Text><Text style={s.title}>{def.name}</Text><Text style={s.body}>{def.description}</Text>
      <Text style={s.body}>{item.currentProgress.toLocaleString()} / {item.maxProgress.toLocaleString()} · {pct}%</Text>
      <View accessibilityRole="progressbar" accessibilityValue={{min:0,max:item.maxProgress,now:item.currentProgress}} style={{height:5,backgroundColor:'#17333e',borderRadius:4,marginTop:10}}><View style={{height:5,width:pct+'%',backgroundColor:'#62efff',borderRadius:4}} /></View>
    </View>; })}
  </SystemPage>;
}
