import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import QuestRunScreen from '../system2/screens/QuestRunScreen';
import { useSystem } from '../system2/state/SystemProvider';
import { useMemo } from 'react';
import { getQuest } from '../system2/quests/catalog';
import { FIRST_MOVEMENT_QUEST } from '../system2/quests/firstMovement';
import { SYSTEM_COLORS } from '../system2/core';

export default function QuestRoute() {
  const { questId } = useLocalSearchParams<{ questId?: string | string[] }>();
  const router = useRouter();
  const { story } = useSystem();
  const id = typeof questId === 'string' ? questId : questId === undefined ? FIRST_MOVEMENT_QUEST.id : '';
  const difficulty = story?.boss?.difficulty;
  const quest = useMemo(() => getQuest(id, difficulty), [id, difficulty]);
  if (!quest) return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: SYSTEM_COLORS.background }}>
      <Text style={{ color: SYSTEM_COLORS.text }}>Nie znaleziono misji.</Text>
      <Pressable onPress={() => router.back()}><Text style={{ color: SYSTEM_COLORS.cyan }}>WRÓĆ</Text></Pressable>
    </View>
  );
  return <QuestRunScreen key={quest.id} quest={quest} />;
}
