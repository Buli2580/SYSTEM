import Action from '../components/Action';
import { DAILY_RULES } from '../daily/calendar';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import SystemPage, { pageStyles as styles } from '../components/SystemPage';
import { AWAKENING_QUESTS, getQuest, getAwakeningProgress, getQuestStatus } from '../quests/catalog';
import { useSystem } from '../state/SystemProvider';
import { questStatusPl, verificationPl } from '../i18n/pl';

export default function QuestsScreen() {
  const router = useRouter();
  const { completedQuestIds, activeQuestId, daily, awakeningCompleted, story } = useSystem();
  const progress = getAwakeningProgress(completedQuestIds);
  return <SystemPage title="QUESTY" subtitle="GŁÓWNA HISTORIA // PROTOKOŁY">
    {!!story && <Action label="GŁÓWNA HISTORIA / KRONIKA →" onPress={()=>router.push('/story')}/>}
    <Text style={styles.body}>PIERWSZE PRZEBUDZENIE · {progress.completed}/{progress.total}</Text>
    {awakeningCompleted && daily && <View style={styles.panel}>
      <Text style={styles.title}>PROTOKÓŁ DZIENNY · {daily.completed}/3</Text>
      <Text style={styles.body}>{daily.dayKey} · {daily.clear ? 'DZIEŃ UKOŃCZONY' : `+${DAILY_RULES.clearXp} REAL XP / +${DAILY_RULES.clearEnergy} ENERGII za ${DAILY_RULES.slots}/${DAILY_RULES.slots}`}</Text>
      {daily.clockAnomaly && <Text style={styles.body}>BŁĄD CZASU — sprawdź datę i godzinę telefonu. Twój postęp został zachowany.</Text>}
      {daily.questIds.map(id => { const q = getQuest(id); if (!q) return null; const done = completedQuestIds.includes(id); return <Pressable key={id} style={styles.panel} disabled={daily.clockAnomaly}
        accessibilityRole="button" onPress={() => router.push({ pathname: '/quest', params: { questId: id } })}>
        <Text style={styles.label}>{done ? 'UKOŃCZONA' : activeQuestId === id ? 'AKTYWNA' : story?.rematchQuestIds.includes(id) ? 'DOSTĘPNY REWANŻ' : daily.suspiciousQuestIds.includes(id) ? 'WYMAGA UWAGI' : 'DOSTĘPNA'} · {q.primarySkill} · {verificationPl(q.verification.type)}{q.activityType ? ' + AKTYWNOŚĆ' : ''}</Text>
        <Text style={styles.title}>{q.title}</Text><Text style={styles.body}>{q.description}</Text>
        <Text style={styles.body}>+{q.rewards.realXp} REAL XP · +{q.rewards.gameEnergy} ENERGII · {Object.entries(q.rewards.skillXp ?? {}).map(([k,v]) => `+${v} ${k} XP`).join(' · ')}</Text>
      </Pressable>; })}
      <Text style={styles.title}>PROTOKÓŁ TYGODNIOWY · {Math.min(5, daily.weeklyCompleted)}/5</Text>
      <Text style={styles.body}>{daily.weeklyClear ? 'TYDZIEŃ UKOŃCZONY' : `${DAILY_RULES.weeklyTarget} aktywności dziennych · +${DAILY_RULES.weeklyXp} REAL XP / +${DAILY_RULES.weeklyEnergy} ENERGII`} · {daily.weekKey}</Text>
    </View>}
    {AWAKENING_QUESTS.map(quest => {
      const status = getQuestStatus(quest.id, completedQuestIds, activeQuestId);
      const locked = status === 'LOCKED';
      return <Pressable key={quest.id} style={styles.panel} disabled={locked}
        accessibilityRole="button" accessibilityLabel={quest.title + ' — ' + status} accessibilityState={{ disabled: locked }}
        onPress={() => router.push({ pathname: '/quest', params: { questId: quest.id } })}>
        <Text style={styles.label}>MISJA {quest.order}/{progress.total} // {questStatusPl(status)}</Text>
        <Text style={styles.title}>{quest.title}</Text>
        <Text style={styles.body}>{[quest.primarySkill, ...quest.secondarySkills].join(' + ')} · {verificationPl(quest.verification.type)}</Text>
        <Text style={styles.body}>{quest.description}</Text>
        <Text style={styles.label}>+{quest.rewards.realXp} REAL XP · +{quest.rewards.gameEnergy} ENERGII</Text>
        <Text style={styles.body}>{Object.entries(quest.rewards.skillXp ?? {}).map(([skill, xp]) => `+${xp} ${skill} XP`).join(' · ')}</Text>
        <Text style={styles.link}>{locked ? 'UKOŃCZ POPRZEDNIĄ MISJĘ' : status === 'COMPLETED' ? 'ZOBACZ UKOŃCZENIE →' : story?.rematchQuestIds.includes(quest.id) ? 'ROZPOCZNIJ REWANŻ →' : 'OTWÓRZ MISJĘ →'}</Text>
      </Pressable>;
    })}
    {progress.completed === progress.total && <View style={styles.panel}><Text style={styles.label}>ROZDZIAŁ 01 // UKOŃCZONY</Text><Text style={styles.body}>POŁĄCZENIE ZE ŚWIATEM // {story?.chapters[1]?.completed??0}/3</Text></View>}
    {!!story && <View style={styles.panel}><Text style={styles.label}>MISJE POBOCZNE</Text><Text style={styles.title}>DODATKOWY WYSIŁEK // {story.sideComplete?'UKOŃCZONA':'DOSTĘPNA'}</Text><Text style={styles.body}>Dzienna misja ruchowa z dystansem co najmniej 125% celu. +50 REAL XP · +40 WIL XP. Jednorazowo.</Text></View>}
    {!!story?.hiddenComplete && <View style={styles.panel}><Text style={styles.label}>UKRYTA // UKOŃCZONA</Text><Text style={styles.title}>BEZ ODWROTU</Text></View>}
    {!!story?.worldLinkComplete && <Action label="PROTOKÓŁ BOSSA // PIERWSZY MUR →" onPress={()=>router.push('/story')}/>}
    <View style={styles.panel}><Text style={styles.body}>Nagrody i ukończenia są zapisane w SYSTEMIE. Przerwane próby nie przyznają częściowego XP.</Text></View>
  </SystemPage>;
}
