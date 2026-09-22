import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import SystemPage, { pageStyles as s } from '../components/SystemPage';
import Action from '../components/Action';
import SystemError from '../components/SystemError';
import { getCloudFriendNetwork, removeCloudFriend, respondCloudFriendRequest, type CloudFriendRow } from '../cloud/socialCore';
import { useMountedRef } from '../hooks/useMountedRef';

export default function FriendsScreen() {
  const router = useRouter();
  const mounted = useMountedRef();
  const lock = useRef(false);
  const [rows, setRows] = useState<CloudFriendRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const next = await getCloudFriendNetwork();
    if (mounted.current) setRows(next);
  }

  async function run(task: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    if (mounted.current) { setBusy(true); setError(null); }
    try {
      await task();
      await load();
    } catch (e) {
      if (mounted.current) setError(e instanceof Error ? e.message : 'FRIENDS_FAILED');
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  useEffect(() => { void run(async () => undefined); }, []);
  return <SystemPage title="ZNAJOMI" subtitle="SYSTEM ONLINE // NETWORK">
    <View style={s.panel}><Text style={s.label}>TWOJA SIEĆ</Text><Text style={s.body}>Zaproszenia i znajomi są oddzieleni od obserwowania. Ty decydujesz, kogo wpuszczasz bliżej.</Text><Action label="ZNAJDŹ GRACZA →" onPress={() => router.push('/player-search')} /></View>
    {rows.length === 0 ? <View style={s.panel}><Text style={s.body}>Brak zaproszeń i znajomych.</Text></View> : rows.map(row => <View key={row.user_id} style={s.panel}><Text style={s.title}>{row.public_name || ('@' + (row.handle || 'gracz'))}</Text><Text style={s.body}>LV {row.real_level} · {row.rank} · {row.status}</Text>{row.status === 'REQUEST_RECEIVED' && <><Action label="AKCEPTUJ" disabled={busy} onPress={() => void run(() => respondCloudFriendRequest(row.user_id, true))} /><Action label="ODRZUĆ" disabled={busy} onPress={() => void run(() => respondCloudFriendRequest(row.user_id, false))} /></>}{row.status === 'FRIENDS' && <Action label="USUŃ ZE ZNAJOMYCH" disabled={busy} onPress={() => void run(() => removeCloudFriend(row.user_id))} /></View>)}
    {error && <SystemError message={error} retry={() => void run(async () => undefined)} />}
  </SystemPage>;
}
