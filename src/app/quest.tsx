import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import QuestRunScreen from '../system2/screens/QuestRunScreen';
import FieldQuestRunScreen from '../system2/screens/FieldQuestRunScreen';
import { getQuest, isFieldTestQuest } from '../system2/quests/catalog';
import { FIRST_MOVEMENT_QUEST } from '../system2/quests/firstMovement';
import { SYSTEM_COLORS } from '../system2/core';

export default function QuestRoute() {
  const { questId } = useLocalSearchParams<{ questId?: string | string[] }>();
  const router = useRouter();
  const id = typeof questId === 'string' ? questId : questId === undefined ? FIRST_MOVEMENT_QUEST.id : '';
  const quest = getQuest(id);
  if (!quest) return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: SYSTEM_COLORS.background }}>
      <Text style={{ color: SYSTEM_COLORS.text }}>Nie znaleziono misji.</Text>
      <Pressable onPress={() => router.back()}><Text style={{ color: SYSTEM_COLORS.cyan }}>WRÓĆ</Text></Pressable>
    </View>
  );
  const isFieldTest = isFieldTestQuest(quest.id);
  return isFieldTest ? (
    <FieldQuestRunScreen key={quest.id} quest={quest} />
  ) : (
    <QuestRunScreen key={quest.id} quest={quest} />
  );
}
