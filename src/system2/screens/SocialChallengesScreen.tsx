import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import SystemPage, { pageStyles as s } from '../components/SystemPage';
import Action from '../components/Action';
import SystemError from '../components/SystemError';
import { getSocialChallenges, getChallengeProgress } from '../cloud/challenges';
import { challengeActive, challengePercent, type SocialChallenge, type ChallengeProgress } from '../social/challenges';
import { useMountedRef } from '../hooks/useMountedRef';

type Row = { challenge: SocialChallenge; progress?: ChallengeProgress };

export default function SocialChallengesScreen() {
  const mounted = useMountedRef();
  const request = useRef(0);
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const id = ++request.current;
    if (mounted.current) { setBusy(true); setError(null); }
    try {
      const challenges = await getSocialChallenges();
      const progress = await Promise.all(challenges.map(challenge => getChallengeProgress(challenge.id).catch(() => [])));
      if (mounted.current && id === request.current) setRows(challenges.map((challenge, index) => ({ challenge, progress: progress[index][0] })));
    } catch (e) {
      if (mounted.current && id === request.current) setError(e instanceof Error ? e.message : 'CHALLENGES_FAILED');
    } finally {
      if (mounted.current && id === request.current) setBusy(false);
    }
  }

  useEffect(() => { void load(); }, []);
  return <SystemPage title="WYZWANIA" subtitle="SYSTEM ONLINE // COMPETE">
    <View style={s.panel}><Text style={s.label}>ACTIVE CHALLENGES</Text><Text style={s.body}>Rywalizacja oparta o questy, XP, dystans i streak.</Text><Action label="ODŚWIEŻ" disabled={busy} onPress={() => void load()} /></View>
    {error && <SystemError message={error} retry={() => void load()} />}
    {!error && rows.length === 0 && <View style={s.panel}><Text style={s.title}>BRAK AKTYWNYCH WYZWAŃ</Text></View>}
    {rows.map(({ challenge: c, progress: p }) => <View key={c.id} style={s.panel}><Text style={s.label}>{c.metric} · {challengeActive(c) ? 'ACTIVE' : 'CLOSED'}</Text><Text style={s.title}>{c.title}</Text><Text style={s.body}>{p?.value ?? 0} / {c.target} · {challengePercent(c, p).toFixed(0)}%</Text></View>)}
  </SystemPage>;
}
