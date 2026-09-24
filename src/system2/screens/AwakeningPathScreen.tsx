import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import SystemPage from '../components/SystemPage';
import Action from '../components/Action';
import AudioEnableAction from '../components/AudioEnableAction';
import { useSystem } from '../state/SystemProvider';
import { AWAKENING_QUESTS } from '../quests/catalog';
import { journeyPlan } from '../journeys/model';
import { GOAL_LABELS } from '../goals/model';
import { SYSTEM_COLORS as C } from '../core';
import {applyCinematicPreset,stopCinematicAudio,triggerAwakeningCinematicState,type AwakeningCinematicState} from '../audio/engine';

export default function AwakeningPathScreen() {
  const router = useRouter();
  const system = useSystem();
  const requested = useRef(false);
  const [awakeningState,setAwakeningState]=useState<AwakeningCinematicState>('CALM');

  const goal = useMemo(() => system.goals
    .filter(item => item.status === 'ACTIVE')
    .slice()
    .sort((a, b) => b.priority - a.priority || a.createdAt.localeCompare(b.createdAt))[0], [system.goals]);

  const journey = goal ? system.journeys.find(item => item.goalId === goal.id) : undefined;
  const stages = goal ? journeyPlan(goal.category) : [];
  const firstQuest = AWAKENING_QUESTS.find(quest => !system.completedQuestIds.includes(quest.id));

  useEffect(() => {
    if (!goal) return;
    applyCinematicPreset('AWAKENING');
    const sequence:Array<[number,Parameters<typeof triggerAwakeningCinematicState>[0]]>=[
      [350,'PORTAL'],[1300,'RUNES'],[2200,'ENERGY'],[3100,'WIND'],[4000,'PUSH'],[4800,'FLASH'],[5100,'DROP'],[5900,'AWAKENED'],
    ];
    const timers=sequence.map(([delay,state])=>setTimeout(()=>{setAwakeningState(state);triggerAwakeningCinematicState(state)},delay));
    return()=>{timers.forEach(timer=>clearTimeout(timer));stopCinematicAudio()};
  },[goal?.id]);

  useEffect(() => {
    if (!goal || system.aiGameMaster || system.aiLoading || requested.current) return;
    requested.current = true;
    const prompt = [goal.title, goal.description, goal.target].filter(Boolean).join(' · ');
    void system.prepareAwakeningDirection(prompt).catch(() => undefined);
  }, [goal, system.aiGameMaster, system.aiLoading, system.prepareAwakeningDirection]);

  if (!goal) return <SystemPage title="AWAKENING PATH" subtitle="AI GAME MASTER" showNavigation={false}>
    <View style={styles.panel}>
      <Text style={styles.code}>BRAK GŁÓWNEGO CELU</Text>
      <Text style={styles.title}>SYSTEM POTRZEBUJE KIERUNKU</Text>
      <Text style={styles.body}>Najpierw wybierz pierwszy cel.</Text>
      <Action label="WYBIERZ CEL →" onPress={() => router.replace('/goals')} />
    </View>
  </SystemPage>;

  const aiState = system.aiLoading ? 'ANALYZING' : system.aiGameMaster?.source === 'ai' ? 'AI ONLINE' : 'SAFE FALLBACK';
  const currentStage = journey?.currentStage ?? 0;

  return <SystemPage title="AWAKENING PATH" subtitle="AI GAME MASTER // FIRST CAMPAIGN" intensity="hero" screen="LAUNCH" scene="PORTAL" threat={2} weather="STORM" awakeningState={awakeningState} showNavigation={false}>
    <AudioEnableAction cue="AWAKENING" />
    <Animated.View entering={FadeInUp.duration(420)} style={[styles.panel, styles.hero]}>
      <Text style={styles.code}>06 // DIRECTION LOCKED</Text>
      <Text style={styles.goalCategory}>{GOAL_LABELS[goal.category]} · PRIORYTET {goal.priority}</Text>
      <Text style={styles.heroTitle}>{goal.title}</Text>
      {!!goal.target && <Text style={styles.target}>TARGET // {goal.target}</Text>}
      <View style={styles.aiBadge}><Text style={styles.aiBadgeText}>{aiState}</Text></View>
    </Animated.View>

    <View style={styles.panel}>
      <Text style={styles.code}>AI GAME MASTER // BRIEFING</Text>
      <Text style={styles.title}>{system.aiLoading ? 'ANALIZA GRACZA I CELU…' : system.aiGameMaster?.director.headline ?? 'PIERWSZA ŚCIEŻKA GOTOWA'}</Text>
      <Text style={styles.body}>{system.aiGameMaster?.director.message ?? 'SYSTEM buduje bezpieczny pierwszy kierunek na podstawie Twojego celu.'}</Text>
      {!!system.aiGameMaster?.briefing && <Text style={styles.briefing}>{system.aiGameMaster.briefing}</Text>}
      {!!system.aiError && <Text style={styles.warning}>{system.aiError}</Text>}
      {!system.aiLoading && <Action label="PRZELICZ KIERUNEK AI" onPress={() => {
        requested.current = true;
        const prompt = [goal.title, goal.description, goal.target].filter(Boolean).join(' · ');
        void system.prepareAwakeningDirection(prompt).catch(() => undefined);
      }} />}
    </View>

    <View style={styles.panel}>
      <Text style={styles.code}>JOURNEY // 5 ETAPÓW</Text>
      {stages.map((stage, index) => {
        const state = index < currentStage ? 'DONE' : index === currentStage ? 'CURRENT' : 'LOCKED';
        return <View key={stage.name} style={[styles.stage, state === 'CURRENT' && styles.stageCurrent]}>
          <Text style={styles.stageIndex}>{String(index + 1).padStart(2, '0')}</Text>
          <View style={styles.stageBody}>
            <Text style={styles.stageName}>{stage.name}</Text>
            <Text style={styles.stageMeta}>{stage.milestone} · {stage.actions} ACTIONS · {stage.days} DAYS</Text>
          </View>
          <Text style={[styles.stageState, state === 'CURRENT' && styles.currentText]}>{state}</Text>
        </View>;
      })}
    </View>

    {!!system.aiGameMaster?.quests.length && <View style={styles.panel}>
      <Text style={styles.code}>AI PATH PREVIEW // PO PRZEBUDZENIU</Text>
      <Text style={styles.body}>AI podpowiada kierunek. Nagrody i wymagania nadal ustala kanoniczny SYSTEM.</Text>
      {system.aiGameMaster.quests.slice(0, 3).map((quest, index) => <View key={quest.key} style={styles.preview}>
        <Text style={styles.previewIndex}>0{index + 1}</Text>
        <View style={styles.stageBody}>
          <Text style={styles.stageName}>{quest.title}</Text>
          <Text style={styles.stageMeta}>{quest.reason}</Text>
        </View>
      </View>)}
    </View>}

    <View style={styles.panel}>
      <Text style={styles.code}>INITIAL QUEST LINE // AWAKENING</Text>
      {AWAKENING_QUESTS.map((quest, index) => {
        const completed = system.completedQuestIds.includes(quest.id);
        const previousDone = index === 0 || system.completedQuestIds.includes(AWAKENING_QUESTS[index - 1].id);
        const status = completed ? 'DONE' : previousDone ? 'READY' : 'LOCKED';
        return <Pressable key={quest.id} disabled={status === 'LOCKED'}
          onPress={() => router.replace({ pathname: '/quest', params: { questId: quest.id } })}
          style={[styles.quest, status === 'READY' && styles.questReady, status === 'LOCKED' && styles.questLocked]}>
          <Text style={styles.questOrder}>QUEST {index + 1}</Text>
          <Text style={styles.questTitle}>{quest.title}</Text>
          <Text style={styles.questStatus}>{status}</Text>
        </Pressable>;
      })}
      {firstQuest
        ? <Action label="ROZPOCZNIJ PIERWSZĄ MISJĘ →" onPress={() => router.replace({ pathname: '/quest', params: { questId: firstQuest.id } })} />
        : <Action label="WEJDŹ DO SYSTEMU →" onPress={() => router.replace('/')} />}
    </View>
  </SystemPage>;
}

const styles = StyleSheet.create({
  panel: { marginTop: 12, padding: 18, borderWidth: 1, borderColor: C.line, borderRadius: 20, backgroundColor: C.panel },
  hero: { borderColor: C.lineBright, overflow: 'hidden' },
  code: { color: C.cyan, fontSize: 9, lineHeight: 14, fontWeight: '900', letterSpacing: 1.25, flexShrink: 1 },
  goalCategory: { color: C.textMuted, fontSize: 9, lineHeight: 14, fontWeight: '900', letterSpacing: 0.95, marginTop: 12, flexShrink: 1 },
  heroTitle: { color: C.white, fontSize: 29, lineHeight: 35, fontWeight: '900', marginTop: 8, flexShrink: 1 },
  target: { color: C.cyanSoft, fontSize: 11, lineHeight: 17, marginTop: 12 },
  aiBadge: { alignSelf: 'flex-start', marginTop: 16, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: C.cyanDark },
  aiBadgeText: { color: C.cyan, fontSize: 8, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: C.white, fontSize: 20, lineHeight: 26, fontWeight: '900', marginTop: 9, flexShrink: 1 },
  body: { color: C.textMuted, fontSize: 12, lineHeight: 19, marginTop: 9 },
  briefing: { color: C.text, fontSize: 13, lineHeight: 20, marginTop: 13 },
  warning: { color: C.warning, fontSize: 10, lineHeight: 16, marginTop: 10 },
  stage: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line },
  stageCurrent: { backgroundColor: 'rgba(0,229,255,0.04)' },
  stageIndex: { color: C.cyan, width: 24, fontSize: 10, fontWeight: '900' },
  stageBody: { flex: 1, minWidth: 0 },
  stageName: { color: C.white, fontSize: 12, lineHeight: 17, fontWeight: '900', flexShrink: 1 },
  stageMeta: { color: C.textMuted, fontSize: 9, lineHeight: 14, marginTop: 4 },
  stageState: { color: C.textVeryMuted, fontSize: 8, lineHeight: 12, fontWeight: '900', flexShrink: 0, marginLeft: 6 },
  currentText: { color: C.cyan },
  preview: { flexDirection: 'row', gap: 11, paddingVertical: 11 },
  previewIndex: { color: C.cyanSoft, width: 24, fontSize: 9, fontWeight: '900' },
  quest: { marginTop: 9, padding: 14, borderWidth: 1, borderColor: C.line, borderRadius: 14 },
  questReady: { borderColor: C.cyan, backgroundColor: 'rgba(0,229,255,0.05)' },
  questLocked: { opacity: 0.45 },
  questOrder: { color: C.cyan, fontSize: 8, fontWeight: '900', letterSpacing: 1.2 },
  questTitle: { color: C.white, fontSize: 15, lineHeight: 21, fontWeight: '900', marginTop: 7, flexShrink: 1 },
  questStatus: { color: C.textMuted, fontSize: 8, fontWeight: '900', marginTop: 6 },
});
