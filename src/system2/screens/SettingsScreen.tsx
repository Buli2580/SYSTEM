import BetaSettings from '../components/BetaSettings';
import { useEffect, useRef, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
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
import { playFeedback, playMusic, stopMusic } from '../identity/audio';
import Slider from '@expo/ui/community/slider';
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
      <Action label="SYSTEM ONLINE // KONTO I PROFIL →" onPress={() => router.push('/account')} />
      <Action label="HISTORIA SYSTEMU →" onPress={() => router.push('/system-log')} /></View>
    <View style={s.panel}><Text style={s.label}>WIBRACJE</Text>
      <Switch accessibilityLabel="Wibracje włączone lub wyłączone" value={settings.haptics} disabled={busy} onValueChange={value => { void run(() => saveSettings({ ...settings, haptics: value })); }} />
      <Text style={[s.label, { marginTop: 18 }]}>AUDIO SYSTEMU</Text>
      <Switch accessibilityLabel="Dźwięk włączony lub wyłączony" value={settings.audio} disabled={busy} onValueChange={value => { void run(async () => {
        await saveSettings({ ...settings, audio: value });
        if (value) playFeedback('SYSTEM_WAKE'); else stopMusic();
      }); }} />
      <VolumeControl label="EFEKTY" value={settings.sfxVolume ?? 0.8} disabled={busy || !settings.audio}
        onChange={value => { void run(async () => { await saveSettings({ ...settings, sfxVolume: value }); playFeedback('UI_TAP'); }); }} />
      <VolumeControl label="MUZYKA / AMBIENT" value={settings.musicVolume ?? 0.35} disabled={busy || !settings.audio}
        onChange={value => { void run(async () => { await saveSettings({ ...settings, musicVolume: value }); playMusic('DASHBOARD'); }); }} />
      <View style={audioStyles.row}>
        <Pressable disabled={!settings.audio} style={audioStyles.test} onPress={() => playFeedback('QUEST_START')}><Text style={audioStyles.testText}>TEST SFX</Text></Pressable>
        <Pressable disabled={!settings.audio} style={audioStyles.test} onPress={() => playMusic('DASHBOARD')}><Text style={audioStyles.testText}>TEST MUSIC</Text></Pressable>
        <Pressable style={audioStyles.test} onPress={stopMusic}><Text style={audioStyles.testText}>STOP</Text></Pressable>
      </View>
      <Text style={s.body}>Efekty obejmują UI, przebudzenie, start questa, weryfikację, XP, level-up i błędy. Boss ma osobny motyw.</Text>
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
    <View style={s.panel}><Text style={s.label}>DANE</Text><Text style={s.body}>Profil, misje, WORLD i preferencje nadal są zapisane lokalnie w SQLite i pozostają dostępne offline. SYSTEM ONLINE dodaje opcjonalne konto, publiczny profil i zaplecze chmurowe bez kasowania lokalnego progresu.</Text>
      <Action label="WYCZYŚĆ DANE SYSTEMU" danger disabled={busy} onPress={() => { guard.current.begin(); setResetStep(1); }} />
    </View>
    <View style={s.panel}><Text style={s.label}>PRYWATNOŚĆ</Text>
      <Text style={s.body}>Sprawdź, jakie dane SYSTEM przetwarza, do czego używa lokalizacji oraz jak działa żądanie usunięcia danych.</Text>
      <Action label="POLITYKA PRYWATNOŚCI →" onPress={() => router.push('/privacy')} />
    </View>
    <View style={s.panel}><Text style={s.label}>O APLIKACJI</Text><Text style={s.title}>SYSTEM 2.0 // FUNDAMENT ONLINE</Text><Text style={s.body}>Wersja aplikacji: {Constants.expoConfig?.version ?? 'niedostępna'}</Text><Text style={s.body}>Mapa WORLD: MapLibre Demo Tiles — konfiguracja developerska.</Text></View>
    {error && <SystemError message={error} retry={() => setError(null)} />}
    <Modal visible={resetStep > 0} animationType="fade" onRequestClose={cancelReset}>
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


function VolumeControl({ label, value, onChange, disabled }: { label: string; value: number; onChange: (value: number) => void; disabled?: boolean }) {
  const [draft, setDraft] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => setDraft(value), [value]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  function change(next: number) {
    setDraft(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(next), 220);
  }
  return <View style={{ marginTop: 16, opacity: disabled ? 0.4 : 1 }}>
    <View style={audioStyles.volumeHeader}><Text style={audioStyles.volumeLabel}>{label}</Text><Text style={audioStyles.volumeValue}>{Math.round(draft * 100)}%</Text></View>
    <Slider
      accessibilityLabel={`${label} głośność`}
      disabled={disabled}
      minimumValue={0}
      maximumValue={1}
      step={0.01}
      value={draft}
      minimumTrackTintColor="#62efff"
      onValueChange={change}
    />
  </View>;
}
const audioStyles = StyleSheet.create({
  volumeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  volumeLabel: { color: '#9bb0b9', fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  volumeValue: { color: '#62efff', fontSize: 10, fontWeight: '900' },
  row: { flexDirection: 'row', gap: 7, marginTop: 15 },
  test: { flex: 1, borderWidth: 1, borderColor: '#28505f', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  testText: { color: '#62efff', fontSize: 7, fontWeight: '900', letterSpacing: 1 },
});
