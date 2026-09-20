import { buildDailyProgressModel, getDailySummaryText } from '../daily/progression';
import WeeklyChallengeCard from '../components/WeeklyChallengeCard';
import { useCallback } from 'react';
import { questAvailability } from '../quests/availability';
import Action from '../components/Action';
import { DAILY_RULES } from '../daily/calendar';
import { Text, View } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import SystemPage, { pageStyles as styles } from '../components/SystemPage';
import { AWAKENING_QUESTS, getQuest, getAwakeningProgress } from '../quests/catalog';
import { useSystem } from '../state/SystemProvider';
import { QuestMissionCard } from '../components/QuestExperience';
import { getNextAction } from '../quests/nextAction';

export default function QuestsScreen() {
  const router = useRouter();
  const system = useSystem();
  const { completedQuestIds, activeQuestId, failedQuestIds = [], daily, awakeningCompleted, story } = system;
  useFocusEffect(useCallback(() => { void system.refreshPlayer(); }, [system.refreshPlayer]));
  const access = (id: string) => questAvailability(id, { completedQuestIds, activeQuestId, daily, failedQuestId: failedQuestIds.includes(id) ? id : null });
  const progress = getAwakeningProgress(completedQuestIds);
  const nextAction = getNextAction({ ...system, player: system.player, completedQuestIds, failedQuestIds, activeQuestId, awakeningCompleted, daily, story, achievements: system.achievementState });
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
    <View style={styles.panel}>
      <Text style={styles.label}>AI GAME MASTER // {system.aiGameMaster?.source === 'ai' ? 'ONLINE' : 'SAFE FALLBACK'}</Text>
      <Text style={styles.title}>{system.aiLoading ? 'ANALIZA GRACZA...' : system.aiGameMaster?.director.headline ?? 'DAILY DIRECTOR'}</Text>
      <Text style={styles.body}>{system.aiGameMaster?.director.message ?? 'SYSTEM analizuje cele, serię i ostatnie wyniki bez zmiany zasad nagród.'}</Text>
      {!!system.aiGameMaster?.briefing && <Text style={styles.body}>{system.aiGameMaster.briefing}</Text>}
      {system.systemDebt > 0 && <Text style={styles.body}>SYSTEM DEBT {system.systemDebt} aktywny — poprzedni Daily Protocol nie został domknięty. Recovery Protocol ma priorytet; zdobyte wcześniej XP pozostaje bez zmian.</Text>}
      {!!system.aiError && <Text style={styles.body}>{system.aiError}</Text>}
      <Action label={system.aiLoading ? 'AI ANALIZUJE...' : 'ODŚWIEŻ AI DIRECTOR →'} onPress={() => { if (!system.aiLoading) void system.refreshAIGameMaster(); }} />
    </View>
    <Action label="CELE →" onPress={() => router.push('/goals')} />
    {!!story && <Action label="MAIN STORY / CHRONICLE →" onPress={()=>router.push('/story')}/>}
    <Text style={styles.body}>PIERWSZE PRZEBUDZENIE · {progress.completed}/{progress.total}</Text>
    {awakeningCompleted && daily && <View style={styles.panel}>
      <Text style={styles.body}>{getDailySummaryText(buildDailyProgressModel(daily, completedQuestIds, activeQuestId, getQuest))}</Text>
      <Text style={styles.title}>DAILY PROTOCOL · {daily.completed}/3</Text>
      <Text style={styles.body}>{daily.dayKey} · {daily.clear ? 'DAILY COMPLETE' : `+${DAILY_RULES.clearXp} REAL XP / +${DAILY_RULES.clearEnergy} ENERGY za ${DAILY_RULES.slots}/${DAILY_RULES.slots}`}</Text>
      {daily.clockAnomaly && <Text style={styles.body}>CLOCK_ANOMALY — sprawdź datę telefonu. Zachowaliśmy Twój postęp.</Text>}
      {[...new Set(daily.questIds)].map((id, index) => { const q = getQuest(id); if (!q) return null; const status = access(id).status; const reason = daily.reasons?.[id]; const contextLabel = story?.rematchQuestIds.includes(id) ? 'REMATCH AVAILABLE' : daily.suspiciousQuestIds.includes(id) ? 'VERIFICATION REVIEW REQUIRED' : reason?.startsWith('AI GAME MASTER') ? reason : undefined; return <QuestMissionCard key={id} quest={q} status={status} contextLabel={contextLabel} disabled={status === 'LOCKED'} progress={q.progress} progressTarget={q.progressTarget} index={index} onPress={() => router.push({ pathname: '/quest', params: { questId: id } })} />; })}
      <Text style={styles.title}>WEEKLY PROTOCOL · {Math.min(5, daily.weeklyCompleted)}/5</Text>
      <Text style={styles.body}>{daily.weeklyClear ? 'WEEKLY COMPLETE' : `${DAILY_RULES.weeklyTarget} Daily activities · +${DAILY_RULES.weeklyXp} REAL XP / +${DAILY_RULES.weeklyEnergy} ENERGY`} · {daily.weekKey}</Text>
    </View>}
    {system.progression?.weeklyChallenges.map(challenge => <WeeklyChallengeCard key={challenge.id} title={challenge.title} progress={challenge.progress} target={challenge.target} completed={challenge.rewardClaimed} />)}
    {AWAKENING_QUESTS.map((quest, index) => {
      const status = access(quest.id).status;
      const locked = status === 'LOCKED';
      return <QuestMissionCard key={quest.id} quest={quest} status={status} disabled={locked} progress={quest.progress} progressTarget={quest.progressTarget} index={index} onPress={() => router.push({ pathname: '/quest', params: { questId: quest.id } })} />;
    })}
    {progress.completed === progress.total && <View style={styles.panel}><Text style={styles.label}>ROZDZIAŁ 01 // UKOŃCZONY</Text><Text style={styles.body}>POŁĄCZENIE ZE ŚWIATEM // {story?.chapters[1]?.completed??0}/3</Text></View>}
    {!!story && <View style={styles.panel}><Text style={styles.label}>MISJE POBOCZNE</Text><Text style={styles.title}>DODATKOWY WYSIŁEK // {story.sideComplete?'UKOŃCZONA':'DOSTĘPNA'}</Text><Text style={styles.body}>Dzienna misja ruchowa z dystansem co najmniej 125% celu. +50 REAL XP · +40 WIL XP. Jednorazowo.</Text></View>}
    {!!story?.hiddenComplete && <View style={styles.panel}><Text style={styles.label}>UKRYTA // UKOŃCZONA</Text><Text style={styles.title}>BEZ ODWROTU</Text></View>}
    {!!story?.worldLinkComplete && <Action label="PROTOKÓŁ BOSSA // PIERWSZY MUR →" onPress={()=>router.push('/story')}/>}
    <View style={styles.panel}><Text style={styles.body}>Nagrody i ukończenia są zapisane w SYSTEMIE. Przerwane próby nie przyznają częściowego XP.</Text></View>
  </SystemPage>;
}
