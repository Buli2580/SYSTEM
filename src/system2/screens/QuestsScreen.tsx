import Action from '../components/Action';
import { DAILY_RULES } from '../daily/calendar';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import SystemPage, { pageStyles as styles } from '../components/SystemPage';
import { AWAKENING_QUESTS, getQuest, getAwakeningProgress, getQuestStatus } from '../quests/catalog';
import { useSystem } from '../state/SystemProvider';
import { QuestMissionCard } from '../components/QuestExperience';
import { getNextAction } from '../quests/nextAction';

export default function QuestsScreen() {
  const router = useRouter();
  const system = useSystem();
  const { completedQuestIds, activeQuestId, failedQuestIds = [], daily, awakeningCompleted, story } = system;
  const progress = getAwakeningProgress(completedQuestIds);
  const nextAction = getNextAction({ player: system.player, completedQuestIds, failedQuestIds, activeQuestId, awakeningCompleted, daily, story, achievements: system.achievementState });
  const openNextAction = () => nextAction.route === '/quest' && nextAction.questId
    ? router.push({ pathname: '/quest', params: { questId: nextAction.questId } })
    : router.push(nextAction.route);
  return <SystemPage title="QUESTY" subtitle="MAIN STORY // PROTOCOLS">
    <View style={styles.panel}>
      <Text style={styles.label}>SYSTEM // NEXT ACTION</Text>
      <Text style={styles.title}>{nextAction.title}</Text>
      <Text style={styles.body}>{nextAction.detail}</Text>
      <Action label="CONTINUE →" onPress={openNextAction}/>
    </View>
    {!!story && <Action label="MAIN STORY / CHRONICLE →" onPress={()=>router.push('/story')}/>}
    <Text style={styles.body}>PIERWSZE PRZEBUDZENIE · {progress.completed}/{progress.total}</Text>
    {awakeningCompleted && daily && <View style={styles.panel}>
      <Text style={styles.title}>DAILY PROTOCOL · {daily.completed}/3</Text>
      <Text style={styles.body}>{daily.dayKey} · {daily.clear ? 'DAILY COMPLETE' : `+${DAILY_RULES.clearXp} REAL XP / +${DAILY_RULES.clearEnergy} ENERGY za ${DAILY_RULES.slots}/${DAILY_RULES.slots}`}</Text>
      {daily.clockAnomaly && <Text style={styles.body}>CLOCK_ANOMALY — sprawdź datę telefonu. Zachowaliśmy Twój postęp.</Text>}
      {[...new Set(daily.questIds)].map((id, index) => { const q = getQuest(id); if (!q) return null; const done = completedQuestIds.includes(id); const status = done ? 'COMPLETED' : activeQuestId === id ? 'ACTIVE' : failedQuestIds.includes(id) ? 'FAILED' : 'AVAILABLE'; const contextLabel = story?.rematchQuestIds.includes(id) ? 'REMATCH AVAILABLE' : daily.suspiciousQuestIds.includes(id) ? 'VERIFICATION REVIEW REQUIRED' : undefined; return <QuestMissionCard key={id} quest={q} status={status} contextLabel={contextLabel} disabled={daily.clockAnomaly} progress={q.progress} progressTarget={q.progressTarget} index={index} onPress={() => router.push({ pathname: '/quest', params: { questId: id } })} />; })}
      <Text style={styles.title}>WEEKLY PROTOCOL · {Math.min(5, daily.weeklyCompleted)}/5</Text>
      <Text style={styles.body}>{daily.weeklyClear ? 'WEEKLY COMPLETE' : `${DAILY_RULES.weeklyTarget} Daily activities · +${DAILY_RULES.weeklyXp} REAL XP / +${DAILY_RULES.weeklyEnergy} ENERGY`} · {daily.weekKey}</Text>
    </View>}
    {AWAKENING_QUESTS.map((quest, index) => {
      const access = getQuestStatus(quest.id, completedQuestIds, activeQuestId);
      const status = access === 'AVAILABLE' && failedQuestIds.includes(quest.id) ? 'FAILED' : access;
      const locked = status === 'LOCKED';
      return <QuestMissionCard key={quest.id} quest={quest} status={status} disabled={locked} progress={quest.progress} progressTarget={quest.progressTarget} index={index} onPress={() => router.push({ pathname: '/quest', params: { questId: quest.id } })} />;
    })}
    {progress.completed === progress.total && <View style={styles.panel}><Text style={styles.label}>ROZDZIAŁ 01 // UKOŃCZONY</Text><Text style={styles.body}>POŁĄCZENIE ZE ŚWIATEM // {story?.chapters[1]?.completed??0}/3</Text></View>}
    {!!story && <View style={styles.panel}><Text style={styles.label}>MISJE POBOCZNE</Text><Text style={styles.title}>EXTRA MILE // {story.sideComplete?'UKOŃCZONA':'DOSTĘPNA'}</Text><Text style={styles.body}>Dzienna misja ruchowa z dystansem co najmniej 125% celu. +50 REAL XP · +40 WIL XP. Jednorazowo.</Text></View>}
    {!!story?.hiddenComplete && <View style={styles.panel}><Text style={styles.label}>UKRYTA // UKOŃCZONA</Text><Text style={styles.title}>NO TURNING BACK</Text></View>}
    {!!story?.worldLinkComplete && <Action label="PROTOKÓŁ BOSSA // THE FIRST WALL →" onPress={()=>router.push('/story')}/>}
    <View style={styles.panel}><Text style={styles.body}>Nagrody i ukończenia są zapisane w SYSTEMIE. Przerwane próby nie przyznają częściowego XP.</Text></View>
  </SystemPage>;
}
