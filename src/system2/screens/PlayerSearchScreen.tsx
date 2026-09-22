import { useMemo, useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import SystemPage, { pageStyles as s } from '../components/SystemPage';
import Action from '../components/Action';
import { searchPlayers } from '../cloud/social';
import { cloudProfileToPublic, normalizePlayerSearch, type PublicPlayerProfile } from '../social';
import { useMountedRef } from '../hooks/useMountedRef';

export default function PlayerSearchScreen() {
  const mounted = useMountedRef();
  const request = useRef(0);
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<PublicPlayerProfile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const valid = useMemo(() => normalizePlayerSearch(query).length >= 2, [query]);

  async function run() {
    const normalized = normalizePlayerSearch(query);
    if (normalized.length < 2) return;
    const id = ++request.current;
    if (mounted.current) { setBusy(true); setError(null); }
    try {
      const found = await searchPlayers(normalized);
      if (mounted.current && id === request.current) setRows(found.map(cloudProfileToPublic));
    } catch (e) {
      if (mounted.current && id === request.current) {
        setRows([]);
        setError(e instanceof Error ? e.message : 'SEARCH_FAILED');
      }
    } finally {
      if (mounted.current && id === request.current) setBusy(false);
    }
  }

  return <SystemPage title="ZNAJDŹ GRACZA" subtitle="NETWORK // CLOUD SEARCH">
    <View style={s.panel}><Text style={s.label}>SYSTEM ID / DISPLAY NAME</Text><TextInput value={query} onChangeText={setQuery} autoCapitalize="none" placeholder="min. 2 znaki" placeholderTextColor="#8397a3" style={{ color: '#fff', minHeight: 52, borderWidth: 1, borderColor: '#24505c', borderRadius: 12, paddingHorizontal: 14, marginTop: 10 }} /><Action label={busy ? 'SZUKAM...' : 'SZUKAJ'} disabled={!valid || busy} onPress={() => void run()} />{error && <Text style={s.body}>{error}</Text>}</View>
    {rows.map(profile => <View key={profile.playerId} style={s.panel}><Text style={s.label}>SYSTEM CLOUD</Text><Text style={s.title}>{profile.displayName}</Text><Text style={s.body}>LV {profile.level} · {profile.rank} · REAL XP {profile.realXp}</Text></View>)}
  </SystemPage>;
}
