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
import { flushCloudOutbox, getLocalCloudSyncStatus } from '../cloud/sync';
import {
  getMySocialProfile,
  updateMySocialProfile,
  type SocialProfile,
} from '../cloud/social';
import { ensureCurrentCloudBinding, flushCloudOutbox, getLocalCloudSyncStatus } from '../cloud/sync';

type SyncStats = { pending: number; synced: number; failed: number };

const inputStyle = {
  color: '#fff',
  minHeight: 52,
  borderWidth: 1,
  borderColor: '#24505c',
  borderRadius: 12,
  paddingHorizontal: 14,
  marginTop: 10,
} as const;

type SyncStats = { pending: number; synced: number; failed: number };

export default function AccountScreen() {
  const router = useRouter();
  const { player } = useSystem();
  const [session, setSession] = useState<CloudSession | null>(null);
  const [social, setSocial] = useState<SocialProfile | null>(null);
  const [syncStats, setSyncStats] = useState<SyncStats>({ pending: 0, synced: 0, failed: 0 });
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
  const [status, setStatus] = useState('SYSTEM CLOUD // NIEPOŁĄCZONY');
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

  async function refreshSyncStats() { setSyncStats(await getLocalCloudSyncStatus()); }

  async function loadOnline(current: CloudSession) {
    try {
      await ensureCurrentCloudBinding();
    } catch (cause) {
      await signOutCloud().catch(() => undefined);
      setSession(null);
      throw cause;
    }
    const profile = await getMySocialProfile();
    fillSocial(profile);
    await refreshSyncStats();
    setStatus('SYSTEM CLOUD // POŁĄCZONY');
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
        if (!active) return;
        await refreshSyncStats();
        if (!current) return;
        try {
          await ensureCurrentCloudBinding();
        } catch (cause) {
          await signOutCloud().catch(() => undefined);
          if (active) {
            setSession(null);
            setStatus('SYSTEM CLOUD // NIEPOŁĄCZONY');
          }
          throw cause;
        }
        if (!active) return;
        setSession(current);
        const profile = await getMySocialProfile();
        if (!active) return;
        fillSocial(profile);
        setStatus('SYSTEM CLOUD // POŁĄCZONY');
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Nie udało się odczytać sesji SYSTEM CLOUD.');
      }
    })();
    return () => { active = false; };
  }, []);

  async function signIn() {
    const current = await signInWithPassword(email, password);
    await loadOnline(current);
    await flushCloudOutbox(50);
    await refreshSyncStats();
    setPassword('');
  }

  async function signUp() {
    const result = await signUpWithPassword(email, password, player.displayName);
    if (!result.session) {
      setStatus(result.confirmationRequired
        ? 'KONTO UTWORZONE // POTWIERDŹ REJESTRACJĘ W E-MAILU'
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
      throw new Error('Publiczny profil wymaga nazwy użytkownika o długości 3–24 znaków: a–z, 0–9 lub _.');
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
    setStatus(isPublic ? 'PROFIL PUBLICZNY // POŁĄCZONY' : 'PROFIL PRYWATNY // POŁĄCZONY');
  }

  async function checkCloud() {
    const state = await fetchCloudState();
    const level = Number(state.state.player?.real_level ?? 1);
    setStatus('CHMURA GOTOWA // SCHEMAT ' + state.schemaVersion + ' // POZIOM ' + level);
  }

  async function syncNow() {
    const result = await flushCloudOutbox(100);
    const stats = await getLocalCloudSyncStatus();
    setSyncStats(stats);
    setStatus(result.pending === 0
      ? 'SYNCHRONIZACJA // WSZYSTKO WYSŁANE'
      : 'SYNCHRONIZACJA // OCZEKUJE ' + result.pending);
  }

  async function logout() {
    await signOutCloud();
    setSession(null);
    setSocial(null);
    setStatus('SYSTEM CLOUD // NIEPOŁĄCZONY');
  }

  return <SystemPage title="SYSTEM ONLINE" subtitle="KONTO // CHMURA // SPOŁECZNOŚĆ">
    <View style={s.panel}>
      <Text style={s.label}>STATUS</Text>
      <Text style={s.title}>{status}</Text>
      <Text style={s.body}>
        SYSTEM działa lokalnie także bez internetu. Konto online jest dodatkową warstwą i nie usuwa progresu zapisanego w telefonie.
      </Text>
      <Action label="← WRÓĆ" onPress={() => router.back()} />
    </View>

    {!session ? <View style={s.panel}>
      <Text style={s.label}>KONTO ONLINE</Text>
      <Text style={s.title}>Zaloguj się lub utwórz konto</Text>
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
      <Action label="ZALOGUJ SIĘ" disabled={busy || !email || password.length < 8} onPress={() => { void run(signIn); }} />
      <Action label="UTWÓRZ KONTO" disabled={busy || !email || password.length < 8} onPress={() => { void run(signUp); }} />
    </View> : <>
      <View style={s.panel}>
        <Text style={s.label}>TOŻSAMOŚĆ W CHMURZE</Text>
        <Text style={s.title}>{session.user.email ?? 'GRACZ SYSTEMU'}</Text>
        <Text style={s.body}>{session.user.id}</Text>
        <Action label="SPRAWDŹ STAN CHMURY" disabled={busy} onPress={() => { void run(checkCloud); }} />
        <Action label="MÓJ PROFIL SYSTEMU →" onPress={() => router.push('/social-profile')} />
        <Action label="RANKINGI I GRACZE →" disabled={busy} onPress={() => router.push('/leaderboard')} />
        <Action label="WYLOGUJ SIĘ" disabled={busy} onPress={() => { void run(logout); }} />
      </View>

      <View style={s.panel}>
        <Text style={s.label}>SYNCHRONIZACJA Z TELEFONU</Text>
        <Text style={s.title}>{syncStats.pending === 0 ? 'BRAK OCZEKUJĄCYCH ZDARZEŃ' : syncStats.pending + ' ZDARZEŃ OCZEKUJE'}</Text>
        <Text style={s.body}>
          Wysłane: {syncStats.synced} · po błędzie: {syncStats.failed}. SYSTEM wysyła wyłącznie podsumowania zweryfikowanych zdarzeń — bez surowych tras GPS i zdjęć.
        </Text>
        <Action label="SYNCHRONIZUJ TERAZ" disabled={busy || syncStats.pending === 0} onPress={() => { void run(syncNow); }} />
      </View>

      <View style={s.panel}>
        <Text style={s.label}>PROFIL SPOŁECZNOŚCIOWY</Text>
        <Text style={s.title}>{social?.visibility === 'public' ? 'PUBLICZNY // WIDOCZNY' : 'PRYWATNY // UKRYTY'}</Text>
        <TextInput accessibilityLabel="Nazwa użytkownika" autoCapitalize="none" autoCorrect={false} maxLength={24}
          value={handle} onChangeText={setHandle} placeholder="nazwa użytkownika" placeholderTextColor="#8397a3" style={inputStyle} />
        <TextInput accessibilityLabel="Publiczna nazwa" maxLength={40}
          value={publicName} onChangeText={setPublicName} placeholder="publiczna nazwa" placeholderTextColor="#8397a3" style={inputStyle} />
        <TextInput accessibilityLabel="Opis profilu" maxLength={240} multiline
          value={bio} onChangeText={setBio} placeholder="krótki opis" placeholderTextColor="#8397a3"
          style={[inputStyle, { minHeight: 88, paddingTop: 14, textAlignVertical: 'top' }]} />
        <Text style={[s.label, { marginTop: 16 }]}>WIDOCZNOŚĆ W RANKINGACH</Text>
        <Switch accessibilityLabel="Profil publiczny" value={isPublic} disabled={busy} onValueChange={setIsPublic} />
        <Text style={[s.label, { marginTop: 16 }]}>LOKALIZACJA RANKINGU // OPCJONALNIE</Text>
        <Text style={s.body}>Wpisujesz ją samodzielnie. SYSTEM nie pobiera miasta z trasy GPS.</Text>
        <TextInput accessibilityLabel="Kontynent" autoCapitalize="characters" maxLength={2}
          value={continent} onChangeText={setContinent} placeholder="EU" placeholderTextColor="#8397a3" style={inputStyle} />
        <TextInput accessibilityLabel="Kraj" autoCapitalize="characters" maxLength={2}
          value={country} onChangeText={setCountry} placeholder="PL" placeholderTextColor="#8397a3" style={inputStyle} />
        <TextInput accessibilityLabel="Region" maxLength={32}
          value={region} onChangeText={setRegion} placeholder="np. pomorskie" placeholderTextColor="#8397a3" style={inputStyle} />
        <TextInput accessibilityLabel="Miasto" maxLength={80}
          value={city} onChangeText={setCity} placeholder="np. Lębork" placeholderTextColor="#8397a3" style={inputStyle} />
        <Action label="ZAPISZ PROFIL ONLINE" disabled={busy} onPress={() => { void run(saveSocial); }} />
      </View>
    </>}

    {error && <SystemError message={error} retry={() => setError(null)} />}
  </SystemPage>;
}
