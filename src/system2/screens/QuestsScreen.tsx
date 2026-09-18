import { DAILY_RULES } from '../daily/calendar';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import SystemPage, { pageStyles as styles } from '../components/SystemPage';
import { AWAKENING_QUESTS, getQuest, getAwakeningProgress, getQuestStatus } from '../quests/catalog';
import { useSystem } from '../state/SystemProvider';

export default function QuestsScreen() {
  const router = useRouter();
  const { completedQuestIds, activeQuestId, daily, awakeningCompleted } = useSystem();
  const progress = getAwakeningProgress(completedQuestIds);
  return <SystemPage title="QUESTY" subtitle="AWAKENING // CHAPTER 01">
    <Text style={styles.body}>PIERWSZE PRZEBUDZENIE · {progress.completed}/{progress.total}</Text>
    {awakeningCompleted && daily && <View style={styles.panel}>
      <Text style={styles.title}>DAILY PROTOCOL · {daily.completed}/3</Text>
      <Text style={styles.body}>{daily.dayKey} · {daily.clear ? 'DAILY COMPLETE' : `+${DAILY_RULES.clearXp} REAL XP / +${DAILY_RULES.clearEnergy} ENERGY za ${DAILY_RULES.slots}/${DAILY_RULES.slots}`}</Text>
      {daily.clockAnomaly && <Text style={styles.body}>CLOCK_ANOMALY — sprawdź datę telefonu. Zachowaliśmy Twój postęp.</Text>}
      {daily.questIds.map(id => { const q = getQuest(id); if (!q) return null; const done = completedQuestIds.includes(id); return <Pressable key={id} style={styles.panel} disabled={daily.clockAnomaly}
        accessibilityRole="button" onPress={() => router.push({ pathname: '/quest', params: { questId: id } })}>
        <Text style={styles.label}>{done ? 'COMPLETED' : activeQuestId === id ? 'ACTIVE' : daily.suspiciousQuestIds.includes(id) ? 'SUSPICIOUS' : 'AVAILABLE'} · {q.primarySkill} · {q.verification.type}{q.activityType ? ' + ACTIVITY' : ''}</Text>
        <Text style={styles.title}>{q.title}</Text><Text style={styles.body}>{q.description}</Text>
        <Text style={styles.body}>+{q.rewards.realXp} REAL XP · +{q.rewards.gameEnergy} ENERGY · {Object.entries(q.rewards.skillXp ?? {}).map(([k,v]) => `+${v} ${k} XP`).join(' · ')}</Text>
      </Pressable>; })}
      <Text style={styles.title}>WEEKLY PROTOCOL · {Math.min(5, daily.weeklyCompleted)}/5</Text>
      <Text style={styles.body}>{daily.weeklyClear ? 'WEEKLY COMPLETE' : `${DAILY_RULES.weeklyTarget} Daily activities · +${DAILY_RULES.weeklyXp} REAL XP / +${DAILY_RULES.weeklyEnergy} ENERGY`} · {daily.weekKey}</Text>
    </View>}
    {AWAKENING_QUESTS.map(quest => {
      const status = getQuestStatus(quest.id, completedQuestIds, activeQuestId);
      const locked = status === 'LOCKED';
      return <Pressable key={quest.id} style={styles.panel} disabled={locked}
        accessibilityRole="button" accessibilityLabel={quest.title + ' — ' + status} accessibilityState={{ disabled: locked }}
        onPress={() => router.push({ pathname: '/quest', params: { questId: quest.id } })}>
        <Text style={styles.label}>QUEST {quest.order}/{progress.total} // {status}</Text>
        <Text style={styles.title}>{quest.title}</Text>
        <Text style={styles.body}>{[quest.primarySkill, ...quest.secondarySkills].join(' + ')} · {quest.verification.type}</Text>
        <Text style={styles.body}>{quest.description}</Text>
        <Text style={styles.label}>+{quest.rewards.realXp} REAL XP · +{quest.rewards.gameEnergy} ENERGY</Text>
        <Text style={styles.body}>{Object.entries(quest.rewards.skillXp ?? {}).map(([skill, xp]) => `+${xp} ${skill} XP`).join(' · ')}</Text>
        <Text style={styles.link}>{locked ? 'UKOŃCZ POPRZEDNI QUEST' : status === 'COMPLETED' ? 'ZOBACZ UKOŃCZENIE →' : 'OTWÓRZ MISJĘ →'}</Text>
      </Pressable>;
    })}
    {progress.completed === progress.total && <View style={styles.panel}><Text style={styles.label}>CHAPTER 01 // COMPLETE</Text><Text style={styles.body}>NEXT CHAPTER // NOT YET AVAILABLE</Text></View>}
    <View style={styles.panel}><Text style={styles.body}>Nagrody i ukończenia są zapisane w SYSTEMIE. Przerwane próby nie przyznają częściowego XP.</Text></View>
  </SystemPage>;
}
