import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import SystemPage, { pageStyles as s } from '../components/SystemPage';
import Action from '../components/Action';
import SystemError from '../components/SystemError';
import { listGuilds, joinGuild } from '../cloud/guilds';
import type { Guild } from '../social/guilds';
import { useMountedRef } from '../hooks/useMountedRef';

export default function GuildsScreen() {
  const mounted = useMountedRef();
  const request = useRef(0);
  const lock = useRef(false);
  const [rows, setRows] = useState<Guild[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const id = ++request.current;
    if (mounted.current) { setBusy(true); setError(null); }
    try {
      const next = await listGuilds();
      if (mounted.current && id === request.current) setRows(next);
    } catch (e) {
      if (mounted.current && id === request.current) setError(e instanceof Error ? e.message : 'GUILDS_FAILED');
    } finally {
      if (mounted.current && id === request.current) setBusy(false);
    }
  }

  async function join(id: string) {
    if (lock.current) return;
    lock.current = true;
    if (mounted.current) { setBusy(true); setError(null); }
    try {
      await joinGuild(id);
      await load();
    } catch (e) {
      if (mounted.current) setError(e instanceof Error ? e.message : 'JOIN_FAILED');
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  useEffect(() => { void load(); }, []);
  return <SystemPage title="GILDIE" subtitle="SYSTEM ONLINE // TEAMS">
    <View style={s.panel}><Text style={s.label}>GUILD NETWORK</Text><Text style={s.body}>Znajdź ekipę, buduj wspólne XP i przygotuj się do raidów.</Text><Action label="ODŚWIEŻ" disabled={busy} onPress={() => void load()} /></View>
    {error && <SystemError message={error} retry={() => void load()} />}
    {!error && rows.length === 0 && <View style={s.panel}><Text style={s.title}>BRAK PUBLICZNYCH GILDII</Text></View>}
    {rows.map(g => <View key={g.id} style={s.panel}><Text style={s.label}>{g.tag} · LV {g.level}</Text><Text style={s.title}>{g.name}</Text><Text style={s.body}>{g.memberCount} graczy · {g.xp.toLocaleString()} GUILD XP</Text><Action label="DOŁĄCZ" disabled={busy} onPress={() => void join(g.id)} /></View>)}
  </SystemPage>;
}
