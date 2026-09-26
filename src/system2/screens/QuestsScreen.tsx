import Action from '../components/Action';
import { DAILY_RULES } from '../daily/calendar';
import { Text, View, Pressable } from 'react-native';
import type { LifeState } from '../adaptive/engine';
import { useRouter } from 'expo-router';
import SystemPage, { pageStyles as styles } from '../components/SystemPage';
import { AWAKENING_QUESTS, getQuest, getAwakeningProgress, getQuestStatus } from '../quests/catalog';
import { useSystem } from '../state/SystemProvider';
import { QuestMissionCard } from '../components/QuestExperience';
import { mainStoryObjective } from '../story/selectors';
import { directNextMission } from '../gameMaster/director';

export default function QuestsScreen() {
  const router = useRouter();
  const { player, completedQuestIds, activeQuestId, daily, awakeningCompleted, story, gameMasterProfile, recentAttempt, recentAttempts, adaptivePlan, adaptiveModel, changeLifeState, changeAvailableMinutes } = useSystem();
  const progress = getAwakeningProgress(completedQuestIds);
  const directive = mainStoryObjective(story, awakeningCompleted);
  const gm = directNextMission({player,daily,story,completedQuestIds,activeQuestId,awakeningCompleted,gameMasterProfile,recentAttempt,recentAttempts,adaptivePlan,adaptiveModel});
  const gmState = gm.message;
  return <SystemPage title="QUESTY" subtitle="MAIN STORY // PROTOCOLS">
    {adaptivePlan && adaptiveModel && <View style={styles.panel}>
      <Text style={styles.label}>ADAPTIVE LIFE ENGINE // TWÓJ PLAN</Text>
      <Text style={styles.title}>{adaptivePlan.lifeState} · {adaptivePlan.dailyCount} DAILY / {adaptiveModel.availableMinutes} MIN</Text>
      <Text style={styles.body}>{adaptivePlan.reasons.join(' · ')}</Text>
      <Text style={styles.body}>Tryb dnia — zmiany liczby misji zaczną obowiązywać od następnego zestawu Daily.</Text>
      <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
        {(['NORMAL','BUSY','TRAVEL','RECOVERY','VACATION'] as LifeState[]).map(state=><Pressable key={state} accessibilityRole="button" accessibilityState={{selected:adaptiveModel.lifeState===state}} onPress={()=>{void changeLifeState(state);}} style={{padding:9,borderWidth:1,borderColor:adaptiveModel.lifeState===state?'#6CEEFF':'#555',borderRadius:8}}><Text style={styles.body}>{state}</Text></Pressable>)}
      </View>
      <Text style={styles.body}>Dostępny czas dziennie</Text>
      <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
        {[15,30,45,60,90].map(minutes=><Pressable key={minutes} accessibilityRole="button" accessibilityState={{selected:adaptiveModel.availableMinutes===minutes}} onPress={()=>{void changeAvailableMinutes(minutes);}} style={{padding:9,borderWidth:1,borderColor:adaptiveModel.availableMinutes===minutes?'#6CEEFF':'#555',borderRadius:8}}><Text style={styles.body}>{minutes} min</Text></Pressable>)}
      </View>
    </View>}
    {!!story && <Action label="MAIN STORY / CHRONICLE →" onPress={()=>router.push('/story')}/>}
    <View style={styles.panel}><Text style={styles.label}>SYSTEM // GAME MASTER</Text><Text style={styles.title}>{gmState}</Text><Text style={styles.body}>{gm.quest ? `${gm.difficulty} // ${gm.quest.title}` : `${gm.difficulty} // ${directive.title}`}</Text>{gm.quest && <Action label={`NEXT MISSION // ${gm.quest.title} →`} onPress={()=>router.push({pathname:'/quest',params:{questId:gm.quest!.id}})}/>}</View>
    <Text style={styles.body}>PIERWSZE PRZEBUDZENIE · {progress.completed}/{progress.total}</Text>
    {awakeningCompleted && daily && <View style={styles.panel}>
      <Text style={styles.title}>DAILY PROTOCOL · {daily.completed}/{daily.questIds.length}</Text>
      <Text style={styles.body}>{daily.dayKey} · {daily.clear ? 'DAILY COMPLETE' : `+${DAILY_RULES.clearXp} REAL XP / +${DAILY_RULES.clearEnergy} ENERGY za ${daily.questIds.length}/${daily.questIds.length}`}</Text>
      {daily.clockAnomaly && <Text style={styles.body}>CLOCK_ANOMALY — sprawdź datę telefonu. Zachowaliśmy Twój postęp.</Text>}
      {daily.questIds.map((id, index) => { const q = getQuest(id); if (!q) return null; const done = completedQuestIds.includes(id); const status = done ? 'COMPLETED' : activeQuestId === id ? 'ACTIVE' : 'AVAILABLE'; const contextLabel = story?.rematchQuestIds.includes(id) ? 'REMATCH AVAILABLE' : daily.suspiciousQuestIds.includes(id) ? 'VERIFICATION REVIEW REQUIRED' : undefined; return <QuestMissionCard key={id} quest={q} status={status} contextLabel={contextLabel} disabled={daily.clockAnomaly} progress={q.progress} progressTarget={q.progressTarget} index={index} onPress={() => router.push({ pathname: '/quest', params: { questId: id } })} />; })}
      <Text style={styles.title}>WEEKLY PROTOCOL · {Math.min(5, daily.weeklyCompleted)}/5</Text>
      <Text style={styles.body}>{daily.weeklyClear ? 'WEEKLY COMPLETE' : `${DAILY_RULES.weeklyTarget} Daily activities · +${DAILY_RULES.weeklyXp} REAL XP / +${DAILY_RULES.weeklyEnergy} ENERGY`} · {daily.weekKey}</Text>
    </View>}
    {AWAKENING_QUESTS.map((quest, index) => {
      const status = getQuestStatus(quest.id, completedQuestIds, activeQuestId);
      const locked = status === 'LOCKED';
      return <QuestMissionCard key={quest.id} quest={quest} status={status} disabled={locked} progress={quest.progress} progressTarget={quest.progressTarget} index={index} onPress={() => router.push({ pathname: '/quest', params: { questId: quest.id } })} />;
    })}
    {progress.completed === progress.total && <View style={styles.panel}><Text style={styles.label}>CHAPTER 01 // COMPLETE</Text><Text style={styles.body}>WORLD LINK // {story?.chapters[1]?.completed??0}/3</Text></View>}
    {!!story && <View style={styles.panel}><Text style={styles.label}>SIDE QUESTS</Text><Text style={styles.title}>EXTRA MILE // {story.sideComplete?'COMPLETED':'AVAILABLE'}</Text><Text style={styles.body}>Ruchowy Daily z dystansem co najmniej 125% celu. +50 REAL XP · +40 WIL XP. Jednorazowo.</Text></View>}
    {!!story?.hiddenComplete && <View style={styles.panel}><Text style={styles.label}>HIDDEN // COMPLETE</Text><Text style={styles.title}>NO TURNING BACK</Text></View>}
    {!!story?.worldLinkComplete && <Action label="BOSS PROTOCOL // THE FIRST WALL →" onPress={()=>router.push('/story')}/>}
    <View style={styles.panel}><Text style={styles.body}>Nagrody i ukończenia są zapisane w SYSTEMIE. Przerwane próby nie przyznają częściowego XP.</Text></View>
  </SystemPage>;
}
