import type { QuestAttempt } from '../story/types';
import { useCallback, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import SystemPage, { pageStyles as s } from '../components/SystemPage';
import Action from '../components/Action';
import SystemError from '../components/SystemError';
import { loadSystemLog, listQuestAttempts } from '../storage/database';
import { awaitWithTimeout } from '../storage/awaitWithTimeout';
import { activityName } from '../identity/history';
import type { VerifiedEvent } from '../core';
export default function SystemLogScreen() {
  const [events, setEvents] = useState<VerifiedEvent[]>([]), [error, setError] = useState<string | null>(null), [loading, setLoading] = useState(true);
  const [attempts,setAttempts]=useState<QuestAttempt[]>([]);
  const request = useRef(0); const router = useRouter();
  const load = useCallback(async () => {
    const id = ++request.current; setLoading(true); setError(null);
    try { const [result,history] = await awaitWithTimeout(Promise.all([loadSystemLog(),listQuestAttempts()])); if (id === request.current) {setEvents(result);setAttempts(history);} }
    catch (cause) { if (id === request.current) setError(cause instanceof Error ? cause.message : 'Nie udało się odczytać historii.'); }
    finally { if (id === request.current) setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); return () => { request.current++; }; }, [load]));
  return <SystemPage title="SYSTEM LOG" subtitle="OSTATNIE 50 ACTIVITY EVENTS">
    <Action label="← POSTAĆ" onPress={() => router.replace('/character')} />
    {error ? <SystemError message={error} retry={() => { void load(); }} /> : loading ? <Text style={s.body}>ODCZYTYWANIE…</Text> : events.length === 0 ? <Text style={s.body}>Twoja historia zacznie się od pierwszej zweryfikowanej aktywności.</Text> : events.map(event => <View key={event.id} style={s.panel}>
      <Text style={s.title}>{activityName(event.questId)}</Text><Text style={s.body}>{new Date(event.createdAt).toLocaleString()}</Text>
      <Text style={s.label}>{event.verificationType} // {event.activity?.verdict ?? 'VERIFIED'}</Text><Text style={s.body}>+{event.realXpAwarded} REAL XP · +{event.gameEnergyAwarded} ENERGY</Text>
      <Text style={s.body}>{Object.entries(event.skillXpAwarded).map(([key, xp]) => `+${xp} ${key} XP`).join(' · ')}</Text>
      {event.activity && <Text style={s.body}>VERIFICATION · {event.activity.activityTypeDetected} · {event.activity.verdict} · {event.activity.verificationScore}/100 · {event.activity.sensorSources.join(' + ')}</Text>}
      {event.distanceMeters !== undefined && <Text style={s.body}>{Math.round(event.distanceMeters)} M</Text>}
      {event.durationSeconds !== undefined && <Text style={s.body}>{Math.floor(event.durationSeconds / 60)} MIN {Math.floor(event.durationSeconds % 60)} SEC</Text>}
    </View>)}
    {attempts.length>0&&<Text style={s.title}>QUEST ATTEMPTS</Text>}
    {attempts.map(a=><View key={a.attempt_id} style={s.panel}><Text style={s.label}>{a.result??'ACTIVE'} // {activityName(a.quest_id)}</Text><Text style={s.body}>{new Date(a.started_at).toLocaleString()} · {Math.floor(a.duration)} SEC · {Math.round(a.distance)} M</Text><Text style={s.body}>{a.eligible?'REMATCH ELIGIBLE':a.reason??''}</Text></View>)}
  </SystemPage>;
}
