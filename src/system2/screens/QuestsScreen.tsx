import type { LifeState } from '../adaptive/engine';
import Action from '../components/Action';
import { DAILY_RULES } from '../daily/calendar';
import { Text, View, Pressable } from 'react-native';
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
  const { adaptivePlan, adaptiveModel, changeLifeState, changeAvailableMinutes } = system;
  const progress = getAwakeningProgress(completedQuestIds);
  const nextAction = getNextAction({ player: system.player, completedQuestIds, failedQuestIds, activeQuestId, awakeningCompleted, daily, story, achievements: system.achievementState });
  const openNextAction = () => nextAction.route === '/quest' && nextAction.questId
    ? router.push({ pathname: '/quest', params: { questId: nextAction.questId } })
    : router.push(nextAction.route);
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
      <Text style={styles.title}>DAILY PROTOCOL · {daily.completed}/{daily.questIds.length}</Text>
      <Text style={styles.body}>{daily.dayKey} · {daily.clear ? 'DAILY COMPLETE' : `+${DAILY_RULES.clearXp} REAL XP / +${DAILY_RULES.clearEnergy} ENERGY za ${daily.questIds.length}/${daily.questIds.length}`}</Text>
      {daily.clockAnomaly && <Text style={styles.body}>CLOCK_ANOMALY — sprawdź datę telefonu. Zachowaliśmy Twój postęp.</Text>}
      {[...new Set(daily.questIds)].map((id, index) => { const q = getQuest(id); if (!q) return null; const access = getQuestStatus(id, completedQuestIds, activeQuestId); const status = access === 'AVAILABLE' && failedQuestIds.includes(id) ? 'FAILED' : access; const reason = daily.reasons?.[id]; const contextLabel = story?.rematchQuestIds.includes(id) ? 'REMATCH AVAILABLE' : daily.suspiciousQuestIds.includes(id) ? 'VERIFICATION REVIEW REQUIRED' : reason?.startsWith('AI GAME MASTER') ? reason : undefined; return <QuestMissionCard key={id} quest={q} status={status} contextLabel={contextLabel} disabled={status === 'LOCKED'} progress={q.progress} progressTarget={q.progressTarget} index={index} onPress={() => router.push({ pathname: '/quest', params: { questId: id } })} />; })}
      <Text style={styles.title}>WEEKLY PROTOCOL · {Math.min(daily.weeklyTarget, daily.weeklyCompleted)}/{daily.weeklyTarget}</Text>
      <Text style={styles.body}>{daily.weeklyClear ? 'WEEKLY COMPLETE' : `${daily.weeklyTarget} Daily activities · +${DAILY_RULES.weeklyXp} REAL XP / +${DAILY_RULES.weeklyEnergy} ENERGY`} · {daily.weekKey}</Text>
    </View>}
    {AWAKENING_QUESTS.map((quest, index) => {
      const access = getQuestStatus(quest.id, completedQuestIds, activeQuestId);
      const status = access === 'AVAILABLE' && failedQuestIds.includes(quest.id) ? 'FAILED' : access;
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
