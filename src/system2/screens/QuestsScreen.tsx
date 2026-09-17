import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import SystemPage, { pageStyles as styles } from '../components/SystemPage';
import { AWAKENING_QUESTS, getAwakeningProgress, getQuestStatus } from '../quests/catalog';
import { useSystem } from '../state/SystemProvider';

export default function QuestsScreen() {
  const router = useRouter();
  const { completedQuestIds, activeQuestId } = useSystem();
  const progress = getAwakeningProgress(completedQuestIds);
  return <SystemPage title="QUESTY" subtitle="AWAKENING // CHAPTER 01">
    <Text style={styles.body}>PIERWSZE PRZEBUDZENIE · {progress.completed}/{progress.total}</Text>
    {AWAKENING_QUESTS.map(quest => {
      const status = getQuestStatus(quest.id, completedQuestIds, activeQuestId);
      const locked = status === 'LOCKED';
      return <Pressable key={quest.id} style={styles.panel} disabled={locked}
        accessibilityRole="button" accessibilityState={{ disabled: locked }}
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
    <View style={styles.panel}><Text style={styles.body}>Nagrody i ukończenia są zapisane w SYSTEMIE. Przerwane próby nie przyznają częściowego XP.</Text></View>
  </SystemPage>;
}
