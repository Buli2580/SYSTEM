import Action from '../components/Action';
import { Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import SystemPage from '../components/SystemPage';
import { AWAKENING_QUESTS, getQuest, getAwakeningProgress, getQuestStatus, getBlockingPrerequisite } from '../quests/catalog';
import { useSystem } from '../state/SystemProvider';
import QuestCard from '../components/QuestCard';
import DailyProgressCard from '../components/DailyProgressCard';
import ProgressionDashboard from '../components/ProgressionDashboard';
import { telemetry } from '../telemetry/TelemetryProvider';

type QuestCompletionInfo = {
  verificationScore: number;
  completedAt: string;
  distanceMeters: number;
  durationSeconds: number;
  verificationType: string;
} | null;

async function loadCompletionDetails(questId: string): Promise<QuestCompletionInfo> {
  const { getQuestCompletionDetails } = await import('../storage/database');
  return getQuestCompletionDetails(questId);
}

export default function QuestsScreen() {
  const router = useRouter();
  const { player, completedQuestIds, activeQuestId, daily, story, lastReward } = useSystem();
  const progress = getAwakeningProgress(completedQuestIds);
  const [completionCache, setCompletionCache] = useState<Record<string, QuestCompletionInfo>>({});

  useEffect(() => {
    const completedQuests = AWAKENING_QUESTS.filter(q => completedQuestIds.includes(q.id));
    if (completedQuests.length === 0) return;
    let active = true;
    Promise.all(completedQuests.map(q => loadCompletionDetails(q.id).then(details => ({ id: q.id, details }))))
      .then(results => {
        if (!active) return;
        const cache: Record<string, QuestCompletionInfo> = {};
        results.forEach(({ id, details }) => { cache[id] = details; });
        setCompletionCache(cache);
      });
    return () => { active = false; };
  }, [completedQuestIds]);

  const handleQuestPress = (questId: string) => {
    telemetry.trackEvent('quest_started', { questId });
    router.push({ pathname: '/quest', params: { questId } });
  };

  return (
    <SystemPage title="QUESTY" subtitle="MAIN STORY // PROTOCOLS">
      <ProgressionDashboard player={player} lastReward={lastReward} />

      {progress.completed < progress.total && (
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>AWAKENING PROGRESS</Text>
          <View style={styles.awakeningProgress}>
            <Text style={styles.progressMain}>
              {progress.completed} / {progress.total} QUESTS
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress.percent}%` }]} />
            </View>
            <Text style={styles.progressSub}>
              {progress.percent === 100 ? 'AWAKENING COMPLETE' : `${Math.round(progress.percent)}% COMPLETE`}
            </Text>
          </View>
        </View>
      )}

      <DailyProgressCard
        daily={daily}
        completedQuestIds={completedQuestIds}
        activeQuestId={activeQuestId}
        getQuest={getQuest}
        onQuestPress={handleQuestPress}
      />

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>AWAKENING QUESTS</Text>
        {AWAKENING_QUESTS.map(quest => {
          const status = getQuestStatus(quest.id, completedQuestIds, activeQuestId);
          const locked = status === 'LOCKED';
          const completed = status === 'COMPLETED';
          const completion = completionCache[quest.id];

          return (
            <QuestCard
              key={quest.id}
              quest={quest}
              status={status as 'LOCKED' | 'AVAILABLE' | 'ACTIVE' | 'COMPLETED'}
              completion={completion}
              disabled={locked}
              onPress={() => handleQuestPress(quest.id)}
              showExtended={completed}
            />
          );
        })}
      </View>

      {progress.completed === progress.total && (
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>CHAPTER STATUS</Text>
          <Text style={styles.body}>CHAPTER 01 // COMPLETE</Text>
          <Text style={styles.body}>WORLD LINK // {story?.chapters[1]?.completed ?? 0}/3</Text>
        </View>
      )}

      {story && (
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>SIDE & HIDDEN</Text>
          <Text style={styles.body}>
            EXTRA MILE // {story.sideComplete ? 'COMPLETED' : 'AVAILABLE'}
          </Text>
          <Text style={styles.body}>
            Ruchowy Daily z dystansem co najmniej 125% celu. +50 REAL XP · +40 WIL XP. Jednorazowo.
          </Text>
          {story.hiddenComplete && (
            <Text style={styles.body}>NO TURNING BACK // COMPLETED</Text>
          )}
        </View>
      )}

      {story?.worldLinkComplete && (
        <Action label="BOSS PROTOCOL // THE FIRST WALL →" onPress={() => router.push('/story')} />
      )}

      <View style={styles.panel}>
        <Text style={styles.body}>Nagrody i ukończenia są zapisane w SYSTEMIE. Przerwane próby nie przyznają częściowego XP.</Text>
      </View>
    </SystemPage>
  );
}

const styles = StyleSheet.create({
  panel: {
    padding: 20,
    marginTop: 16,
    backgroundColor: '#061116',
    borderWidth: 1,
    borderColor: '#1a3a44',
    borderRadius: 20,
  },

  sectionTitle: {
    color: '#62efff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 12,
  },

  awakeningProgress: {
    gap: 8,
  },

  progressMain: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },

  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#09252C',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#62efff',
  },

  progressSub: {
    color: '#62efff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },

  body: {
    color: '#91a5b2',
    fontSize: 13,
    lineHeight: 21,
    marginTop: 12,
  },

  label: {
    color: '#62efff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  title: {
    color: '#fff',
    fontSize: 23,
    fontWeight: '900',
    marginTop: 12,
  },

  link: {
    color: '#62efff',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 20,
  },
});