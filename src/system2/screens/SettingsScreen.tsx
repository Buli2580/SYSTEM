import BetaSettings from '../components/BetaSettings';
import { useRef, useState, useEffect } from 'react';
import { Linking, Modal, ScrollView, Switch, Text, TextInput, View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import SystemPage, { pageStyles as s } from '../components/SystemPage';
import Action from '../components/Action';
import SystemError from '../components/SystemError';
import { useSystem } from '../state/SystemProvider';
import { createResetConfirmation } from '../identity/reset';
import { awaitWithTimeout } from '../storage/awaitWithTimeout';
import { initializeAuth, signUp, signIn, signOut, getCurrentAuthState, getCurrentUser, onAuthStateChange, getConnectionState, onConnectionStateChange, fetchCloudData, pushLocalToCloud, mapCloudToLocalDTO } from '../cloud';

export default function SettingsScreen() {
  const { player, settings, saveSettings, resetData, refreshPlayer } = useSystem();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState('');
  const [resetStep, setResetStep] = useState(0);
  const [confirmation, setConfirmation] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'GUEST' | 'AUTHENTICATED'>('GUEST');
  const [connectionState, setConnectionState] = useState<'OFFLINE' | 'CONNECTING' | 'ONLINE' | 'ERROR'>('OFFLINE');
  const [cloudUser, setCloudUser] = useState<{ id: string; email: string } | null>(null);
  const [syncStatus, setSyncStatus] = useState<{ lastSyncAt: string | null; error: string | null }>({ lastSyncAt: null, error: null });
  const guard = useRef(createResetConfirmation());
  const lock = useRef(false);

  async function run(task: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      await task();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Operacja nie powiodła się.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  function cancelReset() {
    guard.current.cancel();
    setResetStep(0);
    setConfirmation('');
  }

  useEffect(() => {
    initializeAuth().then(() => {
      setAuthMode(getCurrentAuthState());
      const user = getCurrentUser();
      if (user) setCloudUser({ id: user.id, email: user.email });
    });
    const unsubAuth = onAuthStateChange((mode, user) => {
      setAuthMode(mode);
      setCloudUser(user ? { id: user.id, email: user.email } : null);
    });
    const unsubConn = onConnectionStateChange(setConnectionState);
    return () => {
      unsubAuth();
      unsubConn();
    };
  }, []);

  async function handleSignUp() {
    if (!email || !password) return;
    await run(async () => {
      const { user, error } = await signUp(email, password);
      if (error) throw new Error(error);
      if (user) {
        setEmail('');
        setPassword('');
        await fetchCloudData();
      }
    });
  }

  async function handleSignIn() {
    if (!email || !password) return;
    await run(async () => {
      const { user, error } = await signIn(email, password);
      if (error) throw new Error(error);
      if (user) {
        setEmail('');
        setPassword('');
        await fetchCloudData();
      }
    });
  }

  async function handleSignOut() {
    await run(async () => {
      const { error } = await signOut();
      if (error) throw new Error(error);
      setCloudUser(null);
      setSyncStatus({ lastSyncAt: null, error: null });
    });
  }

  async function handleSync() {
    await run(async () => {
      const { player: localPlayer } = useSystem();
      const { success, error } = await pushLocalToCloud(
        localPlayer,
        Object.values(localPlayer.stats),
        [], // quest completions would come from local storage
        []  // story progress would come from local storage
      );
      if (error) throw new Error(error);
      if (success) {
        setSyncStatus({ lastSyncAt: new Date().toISOString(), error: null });
      }
    });
  }

  async function handleFetchCloud() {
    await run(async () => {
      const { success, error } = await fetchCloudData();
      if (error) throw new Error(error);
      if (success) {
        setSyncStatus({ lastSyncAt: new Date().toISOString(), error: null });
      }
    });
  }

  return (
    <SystemPage title="WIĘCEJ" subtitle="SYSTEM SETTINGS">
      <View style={s.panel}>
        <Text style={s.label}>SYSTEM ID // LOCAL IDENTITY</Text>
        <Text style={s.title}>{player.displayName}</Text>
        <Text style={s.body}>{player.id}</Text>
        <Text style={s.body}>Utworzono {new Date(player.createdAt).toLocaleDateString()}</Text>
        <Action label="SYSTEM LOG →" onPress={() => router.push('/system-log')} />
      </View>

      <View style={s.panel}>
        <Text style={s.label}>CLOUD ACCOUNT</Text>
        <Text style={s.body}>
          Status: {authMode === 'GUEST' ? 'GUEST (offline)' : 'CONNECTED'}
          {cloudUser && <Text style={s.body}> · {cloudUser.email}</Text>}
        </Text>
        <Text style={s.body}>Sync: {connectionState}</Text>
        {syncStatus.lastSyncAt && (
          <Text style={s.body}>Ostatnia synchronizacja: {new Date(syncStatus.lastSyncAt).toLocaleString()}</Text>
        )}
        {syncStatus.error && <Text style={{ ...s.body, color: '#ff6b6b' }}>Błąd: {syncStatus.error}</Text>}

        {authMode === 'GUEST' ? (
          <>
            <Text style={s.body}>Brak konfiguracji Supabase lub użytkownik niezalogowany. Aplikacja działa w trybie offline.</Text>
            <TextInput
              accessibilityLabel="Email"
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={{ color: '#fff', minHeight: 44, borderBottomWidth: 1, borderBottomColor: '#333', marginTop: 8 }}
            />
            <TextInput
              accessibilityLabel="Hasło"
              placeholder="Hasło (min. 6 znaków)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={{ color: '#fff', minHeight: 44, borderBottomWidth: 1, borderBottomColor: '#333', marginTop: 8 }}
            />
            <Action label="ZAREJESTRUJ SIĘ" disabled={busy || !email || password.length < 6} onPress={handleSignUp} />
            <Action label="ZALOGUJ SIĘ" disabled={busy || !email || password.length < 6} onPress={handleSignIn} />
          </>
        ) : (
          <>
            <Action label="WYLOGUJ SIĘ" danger disabled={busy} onPress={handleSignOut} />
            <Action label="SYNCHRONIZUJ Z CHMURĄ" disabled={busy || connectionState === 'CONNECTING'} onPress={handleSync} />
            <Action label="POBIERZ Z CHMURY" disabled={busy || connectionState === 'CONNECTING'} onPress={handleFetchCloud} />
          </>
        )}
      </View>

      <View style={s.panel}>
        <Text style={s.label}>HAPTICS</Text>
        <Switch
          accessibilityLabel="Haptics ON/OFF"
          value={settings.haptics}
          disabled={busy}
          onValueChange={value => { void run(() => saveSettings({ ...settings, haptics: value })); }}
        />
        <Text style={s.label}>AUDIO</Text>
        <Switch
          accessibilityLabel="Audio ON/OFF"
          value={settings.audio}
          disabled={busy}
          onValueChange={value => { void run(() => saveSettings({ ...settings, audio: value })); }}
        />
        <Text style={s.body}>Dźwięk ukończenia lub level-up. Jeden efekt dla jednej nagrody.</Text>
      </View>

      <View style={s.panel}>
        <Text style={s.label}>PERMISSIONS</Text>
        <Text style={s.body}>GPS działa tylko podczas aktywnego pomiaru na pierwszym planie.</Text>
        {permission !== '' && <Text style={s.body}>{permission}</Text>}
        <Action
          label="SPRAWDŹ / PONÓW ZGODĘ GPS"
          disabled={busy}
          onPress={() => {
            void run(async () => {
              const result = await awaitWithTimeout(Location.requestForegroundPermissionsAsync());
              setPermission(result.granted ? 'Lokalizacja: zgoda udzielona.' : result.canAskAgain ? 'Lokalizacja: brak zgody.' : 'Zmień zgodę w ustawieniach systemowych aplikacji.');
            });
          }}
        />
        <Action label="USTAWIENIA SYSTEMOWE APLIKACJI" onPress={() => { void run(() => Linking.openSettings()); }} />
      </View>

      <BetaSettings />

      <View style={s.panel}>
        <Text style={s.label}>DATA</Text>
        <Text style={s.body}>Profil, questy, World i preferencje są zapisane lokalnie w SQLite. Avatar pozostaje w katalogu aplikacji. Zaloguj się do Supabase aby włączyć synchronizację. Odinstalowanie aplikacji może usunąć progres lokalny.</Text>
        <Action label="RESET SYSTEM DATA" danger disabled={busy} onPress={() => { guard.current.begin(); setResetStep(1); }} />
      </View>

      <View style={s.panel}>
        <Text style={s.label}>ABOUT</Text>
        <Text style={s.title}>SYSTEM 2.0 // MVP BUILD</Text>
        <Text style={s.body}>Wersja aplikacji: {Constants.expoConfig?.version ?? 'niedostępna'}</Text>
        <Text style={s.body}>World map: MapLibre Demo Tiles — konfiguracja developerska.</Text>
      </View>

      {error && <SystemError message={error} retry={() => setError(null)} />}

      <Modal visible={resetStep > 0} animationType="fade" onRequestClose={cancelReset}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            padding: 24,
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 24,
            backgroundColor: '#030709',
          }}
        >
          <Text style={s.title}>RESET SYSTEM DATA // {resetStep}/2</Text>
          <Text style={s.body}>Usuniesz REAL XP, skille, questy, World, historię, ustawienia i avatar. Tej operacji nie można cofnąć. Oryginalne zdjęcia w galerii pozostaną.</Text>
          {resetStep === 1 ? (
            <Action label="ROZUMIEM — PRZEJDŹ DO POTWIERDZENIA" danger onPress={() => { guard.current.confirmWarning(); setResetStep(2); }} />
          ) : (
            <>
              <Text style={s.body}>Aby potwierdzić drugi raz, wpisz RESET.</Text>
              <TextInput
                accessibilityLabel="Wpisz RESET"
                value={confirmation}
                onChangeText={setConfirmation}
                autoCapitalize="characters"
                style={{ color: '#fff', minHeight: 52, borderBottomWidth: 1, borderBottomColor: '#ffb9b9' }}
              />
              <Action
                label="USUŃ WSZYSTKIE DANE SYSTEMU"
                danger
                disabled={busy || confirmation !== 'RESET'}
                onPress={() => {
                  const confirmed = guard.current.confirmErase(confirmation);
                  setResetStep(0);
                  setConfirmation('');
                  void run(async () => { await resetData(confirmed); router.replace('/'); });
                }}
              />
            </>
          )}
          <Action label="ANULUJ" onPress={cancelReset} />
        </ScrollView>
      </Modal>
    </SystemPage>
  );
}