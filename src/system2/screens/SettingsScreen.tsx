import BetaSettings from '../components/BetaSettings';
import { useRef, useState } from 'react';
import { Linking, Modal, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import SystemPage, { pageStyles as s } from '../components/SystemPage';
import Action from '../components/Action';
import SystemError from '../components/SystemError';
import { useSystem } from '../state/SystemProvider';
import { createResetConfirmation } from '../identity/reset';
import { requestBackgroundLocationAccess } from '../background/locationService';
import { confirmBackgroundLocationDisclosure } from '../background/disclosure';
import { awaitWithTimeout } from '../storage/awaitWithTimeout';
export default function SettingsScreen() {
  const { player, settings, saveSettings, resetData } = useSystem(); const router = useRouter(); const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false), [error, setError] = useState<string | null>(null), [permission, setPermission] = useState('');
  const [resetStep, setResetStep] = useState(0), [confirmation, setConfirmation] = useState('');
  const guard = useRef(createResetConfirmation()), lock = useRef(false);
  async function run(task: () => Promise<void>) {
    if (lock.current) return; lock.current = true; setBusy(true); setError(null);
    try { await task(); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Operacja nie powiodła się.'); }
    finally { lock.current = false; setBusy(false); }
  }
  function cancelReset() { guard.current.cancel(); setResetStep(0); setConfirmation(''); }
  return <SystemPage title="WIĘCEJ" subtitle="USTAWIENIA SYSTEMU">
    <View style={s.panel}><Text style={s.label}>SYSTEM ID // TOŻSAMOŚĆ LOKALNA</Text><Text style={s.title}>{player.displayName}</Text>
      <Text style={s.body}>{player.id}</Text><Text style={s.body}>Utworzono {new Date(player.createdAt).toLocaleDateString()}</Text>
      <Action label="AI GAME MASTER →" onPress={() => router.push('/game-master')} />
      <Action label="OSIĄGNIĘCIA →" onPress={() => router.push('/achievements')} /><Action label="SYSTEM ONLINE // HUB →" onPress={() => router.push('/system-online')} /><Action label="RANKINGI // SYSTEM ONLINE →" onPress={() => router.push('/leaderboard')} /><Action label="SYSTEM LOG →" onPress={() => router.push('/system-log')} /></View>
    <View style={s.panel}><Text style={s.label}>HAPTICS</Text>
      <Switch accessibilityLabel="Haptics ON/OFF" value={settings.haptics} disabled={busy} onValueChange={value => { void run(() => saveSettings({ ...settings, haptics: value })); }} />
      <Text style={s.label}>AUDIO</Text><Switch accessibilityLabel="Audio ON/OFF" value={settings.audio} disabled={busy} onValueChange={value => { void run(() => saveSettings({ ...settings, audio: value })); }} />
      <Text style={s.body}>Dźwięki startu misji, błędu/recovery, ukończenia i level-up. Nagroda nadal odtwarza tylko jeden kanoniczny efekt.</Text>
    </View>
    <View style={s.panel}><Text style={s.label}>UPRAWNIENIA</Text><Text style={s.body}>Podczas aktywnej misji ruchowej GPS może działać przy wygaszonym ekranie i w tle. Android pokaże stałe powiadomienie o aktywnym pomiarze.</Text>
      {permission !== '' && <Text style={s.body}>{permission}</Text>}
      <Action label="SPRAWDŹ / PONÓW ZGODĘ GPS" disabled={busy} onPress={() => { void run(async () => {
        const result = await awaitWithTimeout(Location.requestForegroundPermissionsAsync());
        setPermission(result.granted ? 'Lokalizacja na pierwszym planie: zgoda udzielona.' : result.canAskAgain ? 'Lokalizacja: brak zgody.' : 'Zmień zgodę w ustawieniach systemowych aplikacji.');
      }); }} />
      <Action label="WŁĄCZ LOKALIZACJĘ W TLE" disabled={busy} onPress={() => { void run(async () => {
        const disclosureAccepted = await confirmBackgroundLocationDisclosure();
        if (!disclosureAccepted) {
          setPermission('Lokalizacja w tle nie została włączona.');
          return;
        }
        const foreground = await awaitWithTimeout(Location.requestForegroundPermissionsAsync());
        if (!foreground.granted) {
          setPermission('Najpierw zezwól na lokalizację podczas używania aplikacji.');
          return;
        }
        const granted = await awaitWithTimeout(requestBackgroundLocationAccess());
        setPermission(granted
          ? 'Lokalizacja w tle: włączona. Misje ruchowe mogą działać przy wygaszonym ekranie.'
          : 'Lokalizacja w tle: brak zgody. W ustawieniach wybierz dostęp do lokalizacji „zawsze”, jeśli telefon udostępnia tę opcję.');
      }); }} />
      <Action label="USTAWIENIA SYSTEMOWE APLIKACJI" onPress={() => { void run(() => Linking.openSettings()); }} />
    </View>
    <BetaSettings />
    <View style={s.panel}><Text style={s.label}>PRYWATNOŚĆ</Text>
      <Text style={s.body}>Informacje o przetwarzaniu danych, lokalizacji i usuwaniu konta.</Text>
      <Action label="POLITYKA PRYWATNOŚCI →" onPress={() => router.push('/privacy')} />
      <Action label="KONTO I PROFIL →" onPress={() => router.push('/account')} />
    </View>
    <View style={s.panel}><Text style={s.label}>DATA</Text><Text style={s.body}>Profil, questy, World i preferencje są zapisane lokalnie w SQLite. Avatar pozostaje w katalogu aplikacji. Funkcje SYSTEM ONLINE są oddzielone od lokalnego progresu i wymagają zalogowania. Odinstalowanie aplikacji może usunąć lokalny progres.</Text>
      {__DEV__ && <Action label="RESET SYSTEM DATA // DEVELOPMENT" danger disabled={busy} onPress={() => { guard.current.begin(); setResetStep(1); }} />}
    </View>
    <View style={s.panel}><Text style={s.label}>ABOUT</Text><Text style={s.title}>SYSTEM 2.0 // MVP BUILD</Text><Text style={s.body}>Wersja aplikacji: {Constants.nativeAppVersion ?? Constants.expoConfig?.version ?? 'niedostępna'} · BUILD {Constants.nativeBuildVersion ?? Constants.expoConfig?.android?.versionCode ?? 'DEV'}</Text><Text style={s.body}>World map: MapLibre Demo Tiles — konfiguracja developerska.</Text></View>
    {error && <SystemError message={error} retry={() => setError(null)} actionLabel="ZAMKNIJ" />}
    <Modal visible={__DEV__ && resetStep > 0} animationType="fade" onRequestClose={cancelReset}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24, backgroundColor: '#030709' }}>
        <Text style={s.title}>RESET DANYCH SYSTEMU // {resetStep}/2</Text>
        <Text style={s.body}>Usuniesz REAL XP, cechy, misje, WORLD, historię, ustawienia i avatar. Tej operacji nie można cofnąć. Oryginalne zdjęcia w galerii pozostaną.</Text>
        {resetStep === 1 ? <Action label="ROZUMIEM — PRZEJDŹ DO POTWIERDZENIA" danger onPress={() => { guard.current.confirmWarning(); setResetStep(2); }} /> : <>
          <Text style={s.body}>Aby potwierdzić drugi raz, wpisz RESET.</Text>
          <TextInput accessibilityLabel="Wpisz RESET" value={confirmation} onChangeText={setConfirmation} autoCapitalize="characters" style={{ color: '#fff', minHeight: 52, borderBottomWidth: 1, borderBottomColor: '#ffb9b9' }} />
          <Action label="USUŃ WSZYSTKIE DANE SYSTEMU" danger disabled={busy || confirmation !== 'RESET'} onPress={() => {
            const confirmed = guard.current.confirmErase(confirmation); setResetStep(0); setConfirmation('');
            void run(async () => { await resetData(confirmed); router.replace('/'); });
          }} />
        </>}
        <Action label="ANULUJ" onPress={cancelReset} />
      </ScrollView>
    </Modal>
  </SystemPage>;
}
