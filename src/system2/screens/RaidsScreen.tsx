import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import SystemPage, { pageStyles as s } from '../components/SystemPage';
import Action from '../components/Action';
import SystemError from '../components/SystemError';
import { getActiveRaids } from '../cloud/raids';
import { raidHp, type SocialRaid } from '../social/raids';
import { useMountedRef } from '../hooks/useMountedRef';

export default function RaidsScreen() {
  const mounted = useMountedRef();
  const request = useRef(0);
  const [rows, setRows] = useState<SocialRaid[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const id = ++request.current;
    if (mounted.current) { setBusy(true); setError(null); }
    try {
      const next = await getActiveRaids();
      if (mounted.current && id === request.current) setRows(next);
    } catch (e) {
      if (mounted.current && id === request.current) setError(e instanceof Error ? e.message : 'RAIDS_FAILED');
    } finally {
      if (mounted.current && id === request.current) setBusy(false);
    }
  }

  useEffect(() => { void load(); }, []);
  return <SystemPage title="WORLD RAIDS" subtitle="SYSTEM ONLINE // CO-OP BOSS">
    <View style={s.panel}><Text style={s.label}>GLOBAL THREAT</Text><Text style={s.body}>Zweryfikowany progres graczy może zadawać obrażenia wspólnym bossom.</Text><Action label="ODŚWIEŻ" disabled={busy} onPress={() => void load()} /></View>
    {error && <SystemError message={error} retry={() => void load()} />}
    {!error && rows.length === 0 && <View style={s.panel}><Text style={s.title}>BRAK AKTYWNEGO RAIDU</Text></View>}
    {rows.map(r => <View key={r.id} style={s.panel}><Text style={s.label}>{r.status}</Text><Text style={s.title}>{r.title}</Text><Text style={s.body}>HP {raidHp(r).toLocaleString()} / {r.bossHp.toLocaleString()}</Text><Text style={s.body}>DAMAGE NETWORK: {r.damage.toLocaleString()}</Text></View>)}
  </SystemPage>;
}
