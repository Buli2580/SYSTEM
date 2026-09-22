import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import SystemPage, { pageStyles as s } from '../components/SystemPage';
import Action from '../components/Action';
import SystemError from '../components/SystemError';
import { getActivityFeed } from '../cloud/feed';
import { groupFeedByDay } from '../social/feed';
import type { SocialActivityEvent } from '../social/types';
import { useMountedRef } from '../hooks/useMountedRef';

const labels: Record<SocialActivityEvent['type'], string> = { QUEST_COMPLETED: 'QUEST COMPLETED', ACHIEVEMENT_UNLOCKED: 'ACHIEVEMENT', LEVEL_UP: 'LEVEL UP', RANK_UP: 'RANK UP', STREAK_MILESTONE: 'STREAK', BOSS_DEFEATED: 'BOSS DEFEATED', WORLD_SECTOR_DISCOVERED: 'WORLD DISCOVERY', TITLE_UNLOCKED: 'TITLE UNLOCKED' };

export default function FeedScreen() {
  const mounted = useMountedRef();
  const request = useRef(0);
  const [rows, setRows] = useState<SocialActivityEvent[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const id = ++request.current;
    if (mounted.current) { setBusy(true); setError(null); }
    try {
      const next = await getActivityFeed(50);
      if (mounted.current && id === request.current) setRows(next);
    } catch (e) {
      if (mounted.current && id === request.current) setError(e instanceof Error ? e.message : 'FEED_FAILED');
    } finally {
      if (mounted.current && id === request.current) setBusy(false);
    }
  }

  useEffect(() => { void load(); }, []);
  const groups = groupFeedByDay(rows);
  return <SystemPage title="ACTIVITY FEED" subtitle="SYSTEM ONLINE // SIGNALS">
    <View style={s.panel}><Text style={s.label}>NETWORK SIGNAL</Text><Text style={s.body}>Zweryfikowane wydarzenia z Twojej sieci. Prywatna aktywność nie trafia do feedu.</Text><Action label={busy ? 'ŁADOWANIE...' : 'ODŚWIEŻ'} disabled={busy} onPress={() => void load()} /></View>
    {error && <SystemError message={error} retry={() => void load()} />}
    {!error && rows.length === 0 && <View style={s.panel}><Text style={s.title}>CISZA W SIECI</Text><Text style={s.body}>Gdy gracze udostępnią aktywność, pojawi się tutaj.</Text></View>}
    {Object.entries(groups).map(([day, events]) => <View key={day} style={s.panel}><Text style={s.label}>{day}</Text>{events.map(e => <View key={e.id} style={{ paddingVertical: 10 }}><Text style={s.title}>{labels[e.type]}</Text><Text style={s.body}>{new Date(e.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text></View>)}</View>)}
  </SystemPage>;
}
