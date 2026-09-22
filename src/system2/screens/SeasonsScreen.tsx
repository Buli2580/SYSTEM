import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import SystemPage, { pageStyles as s } from '../components/SystemPage';
import Action from '../components/Action';
import SystemError from '../components/SystemError';
import { getCurrentSeason } from '../cloud/seasons';
import { seasonActive, type SocialSeason } from '../social/seasons';
import { useMountedRef } from '../hooks/useMountedRef';

export default function SeasonsScreen() {
  const mounted = useMountedRef();
  const request = useRef(0);
  const [season, setSeason] = useState<SocialSeason | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const id = ++request.current;
    if (mounted.current) { setBusy(true); setError(null); }
    try {
      const next = await getCurrentSeason();
      if (mounted.current && id === request.current) setSeason(next);
    } catch (e) {
      if (mounted.current && id === request.current) setError(e instanceof Error ? e.message : 'SEASON_FAILED');
    } finally {
      if (mounted.current && id === request.current) setBusy(false);
    }
  }

  useEffect(() => { void load(); }, []);
  return <SystemPage title="SEZON" subtitle="SYSTEM ONLINE // CYCLE">
    <View style={s.panel}><Text style={s.label}>CURRENT SEASON</Text>{season ? <><Text style={s.title}>{season.name}</Text><Text style={s.body}>{seasonActive(season) ? 'ACTIVE' : 'INACTIVE'} · {season.startsAt.slice(0, 10)} → {season.endsAt.slice(0, 10)}</Text></> : <Text style={s.title}>BRAK AKTYWNEGO SEZONU</Text>}<Action label="ODŚWIEŻ" disabled={busy} onPress={() => void load()} /></View>
    {error && <SystemError message={error} retry={() => void load()} />}
  </SystemPage>;
}
