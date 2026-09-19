import { useEffect, useRef, useState } from 'react';
import { Switch, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import SystemPage, { pageStyles as s } from '../components/SystemPage';
import Action from '../components/Action';
import SystemError from '../components/SystemError';
import { useSystem } from '../state/SystemProvider';
import {
  getValidSession,
  signInWithPassword,
  signOutCloud,
  signUpWithPassword,
  type CloudSession,
} from '../cloud/auth';
import { fetchCloudState } from '../cloud/state';
import {
  getLeaderboard,
  getMySocialProfile,
  updateMySocialProfile,
  type LeaderboardEntry,
  type SocialProfile,
} from '../cloud/social';

const inputStyle = {
  color: '#fff',
  minHeight: 52,
  borderWidth: 1,
  borderColor: '#24505c',
  borderRadius: 12,
  paddingHorizontal: 14,
  marginTop: 10,
} as const;

export default function AccountScreen() {
  const router = useRouter();
  const { player } = useSystem();
  const [session, setSession] = useState<CloudSession | null>(null);
  const [social, setSocial] = useState<SocialProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [handle, setHandle] = useState('');
  const [publicName, setPublicName] = useState(player.displayName);
  const [bio, setBio] = useState('');
  const [continent, setContinent] = useState('');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [status, setStatus] = useState('SYSTEM CLOUD // OFFLINE');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);

  function fillSocial(profile: SocialProfile) {
    setSocial(profile);
    setHandle(profile.handle ?? '');
    setPublicName(profile.public_name ?? player.displayName);
    setBio(profile.bio ?? '');
    setContinent(profile.continent_code ?? '');
    setCountry(profile.country_code ?? '');
    setRegion(profile.region_code ?? '');
    setCity(profile.city_label ?? '');
    setIsPublic(profile.visibility === 'public');
  }

  async function loadOnline(current: CloudSession) {
    const profile = await getMySocialProfile();
    fillSocial(profile);
    const top = await getLeaderboard('WORLD', null, 10);
    setLeaderboard(top);
    setStatus('SYSTEM CLOUD // ONLINE');
    setSession(current);
  }

  async function run(task: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      await task();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Operacja SYSTEM CLOUD nie powiodła się.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const current = await getValidSession();
        if (!active || !current) return;
        setSession(current);
        const profile = await getMySocialProfile();
        if (!active) return;
        fillSocial(profile);
        const top = await getLeaderboard('WORLD', null, 10);
        if (!active) return;
        setLeaderboard(top);
        setStatus('SYSTEM CLOUD // ONLINE');
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Nie udało się odczytać sesji SYSTEM CLOUD.');
      }
    })();
    return () => { active = false; };
  }, []);

  async function signIn() {
    const current = await signInWithPassword(email, password);
    await loadOnline(current);
    setPassword('');
  }

  async function signUp() {
    const result = await signUpWithPassword(email, password, player.displayName);
    if (!result.session) {
      setStatus(result.confirmationRequired
        ? 'KONTO UTWORZONE // SPRAWDŹ E-MAIL I POTWIERDŹ REJESTRACJĘ'
        : 'KONTO UTWORZONE // ZALOGUJ SIĘ');
      setPassword('');
      return;
    }
    await loadOnline(result.session);
    setPassword('');
  }

  async function saveSocial() {
    const normalizedHandle = handle.trim().toLowerCase();
    if (isPublic && !/^[a-z0-9_]{3,24}$/.test(normalizedHandle)) {
      throw new Error('Publiczny profil wymaga handle 3–24 znaki: a-z, 0-9 lub _.');
    }
    const profile = await updateMySocialProfile({
      handle: normalizedHandle || null,
      public_name: publicName.trim() || player.displayName,
      bio: bio.trim() || null,
      visibility: isPublic ? 'public' : 'private',
      continent_code: continent.trim() || null,
      country_code: country.trim() || null,
      region_code: region.trim() || null,
      city_label: city.trim() || null,
    });
    fillSocial(profile);
    setLeaderboard(await getLeaderboard('WORLD', null, 10));
    setStatus(isPublic ? 'PUBLIC PROFILE // ONLINE' : 'PRIVATE PROFILE // ONLINE');
  }

  async function checkCloud() {
    const state = await fetchCloudState();
    const level = Number(state.state.player?.real_level ?? 1);
    setStatus('CLOUD STATE OK // SCHEMA ' + state.schemaVersion + ' // LV.' + level);
  }

  async function logout() {
    await signOutCloud();
    setSession(null);
    setSocial(null);
    setLeaderboard([]);
    setStatus('SYSTEM CLOUD // OFFLINE');
  }

  return <SystemPage title="SYSTEM ONLINE" subtitle="CLOUD IDENTITY // SOCIAL FOUNDATION">
    <View style={s.panel}>
      <Text style={s.label}>STATUS</Text>
      <Text style={s.title}>{status}</Text>
      <Text style={s.body}>
        Lokalny SQLite nadal działa offline. Konto online jest dodatkową warstwą — nie kasuje lokalnego progresu.
      </Text>
      <Action label="← WRÓĆ" onPress={() => router.back()} />
    </View>

    {!session ? <View style={s.panel}>
      <Text style={s.label}>CLOUD ACCOUNT</Text>
      <Text style={s.title}>Zaloguj lub utwórz konto</Text>
      <TextInput
        accessibilityLabel="E-mail SYSTEM CLOUD"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        placeholder="e-mail"
        placeholderTextColor="#8397a3"
        style={inputStyle}
      />
      <TextInput
        accessibilityLabel="Hasło SYSTEM CLOUD"
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        placeholder="hasło — minimum 8 znaków"
        placeholderTextColor="#8397a3"
        style={inputStyle}
      />
      <Action label="ZALOGUJ" disabled={busy || !email || password.length < 8} onPress={() => { void run(signIn); }} />
      <Action label="UTWÓRZ KONTO" disabled={busy || !email || password.length < 8} onPress={() => { void run(signUp); }} />
    </View> : <>
      <View style={s.panel}>
        <Text style={s.label}>CLOUD ID</Text>
        <Text style={s.title}>{session.user.email ?? 'SYSTEM PLAYER'}</Text>
        <Text style={s.body}>{session.user.id}</Text>
        <Action label="SPRAWDŹ CLOUD STATE" disabled={busy} onPress={() => { void run(checkCloud); }} />
        <Action label="WYLOGUJ SYSTEM CLOUD" disabled={busy} onPress={() => { void run(logout); }} />
      </View>

      <View style={s.panel}>
        <Text style={s.label}>SOCIAL PROFILE</Text>
        <Text style={s.title}>{social?.visibility === 'public' ? 'PUBLIC // VISIBLE' : 'PRIVATE // HIDDEN'}</Text>
        <TextInput accessibilityLabel="Handle" autoCapitalize="none" autoCorrect={false} maxLength={24}
          value={handle} onChangeText={setHandle} placeholder="handle" placeholderTextColor="#8397a3" style={inputStyle} />
        <TextInput accessibilityLabel="Publiczna nazwa" maxLength={40}
          value={publicName} onChangeText={setPublicName} placeholder="publiczna nazwa" placeholderTextColor="#8397a3" style={inputStyle} />
        <TextInput accessibilityLabel="Bio" maxLength={240} multiline
          value={bio} onChangeText={setBio} placeholder="bio" placeholderTextColor="#8397a3"
          style={[inputStyle, { minHeight: 88, paddingTop: 14, textAlignVertical: 'top' }]} />
        <Text style={[s.label, { marginTop: 16 }]}>PUBLIC PROFILE / LEADERBOARD</Text>
        <Switch accessibilityLabel="Profil publiczny" value={isPublic} disabled={busy} onValueChange={setIsPublic} />
        <Text style={[s.label, { marginTop: 16 }]}>RANKING LOCATION // OPCJONALNE</Text>
        <TextInput accessibilityLabel="Kontynent" autoCapitalize="characters" maxLength={2}
          value={continent} onChangeText={setContinent} placeholder="EU" placeholderTextColor="#8397a3" style={inputStyle} />
        <TextInput accessibilityLabel="Kraj" autoCapitalize="characters" maxLength={2}
          value={country} onChangeText={setCountry} placeholder="PL" placeholderTextColor="#8397a3" style={inputStyle} />
        <TextInput accessibilityLabel="Region" maxLength={32}
          value={region} onChangeText={setRegion} placeholder="np. pomorskie" placeholderTextColor="#8397a3" style={inputStyle} />
        <TextInput accessibilityLabel="Miasto" maxLength={80}
          value={city} onChangeText={setCity} placeholder="miasto" placeholderTextColor="#8397a3" style={inputStyle} />
        <Action label="ZAPISZ PROFIL ONLINE" disabled={busy} onPress={() => { void run(saveSocial); }} />
      </View>

      <View style={s.panel}>
        <Text style={s.label}>WORLD LEADERBOARD // TOP 10</Text>
        {leaderboard.length === 0
          ? <Text style={s.body}>Brak publicznych graczy. Pierwszy publiczny profil otworzy ranking.</Text>
          : leaderboard.map(entry => <Text key={entry.user_id} style={s.body}>
            #{entry.rank_position} @{entry.handle ?? 'player'} · LV.{entry.real_level} · {entry.real_total_xp} XP
          </Text>)}
      </View>
    </>}

    {error && <SystemError message={error} retry={() => setError(null)} />}
  </SystemPage>;
}
