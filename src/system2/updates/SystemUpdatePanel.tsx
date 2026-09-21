import { useState } from 'react';
import { Text, View } from 'react-native';
import * as Updates from 'expo-updates';
import Action from '../components/Action';
import { pageStyles as s } from '../components/SystemPage';

export default function SystemUpdatePanel() {
  const [status, setStatus] = useState(
    Updates.isEnabled
      ? 'OTA READY // kanał preview'
      : 'OTA niedostępne w tym buildzie',
  );
  const [busy, setBusy] = useState(false);

  async function checkNow() {
    if (busy) return;
    if (!Updates.isEnabled) {
      setStatus(__DEV__
        ? 'OTA jest wyłączone w development buildzie. Użyj standalone/release APK.'
        : 'OTA nie jest skonfigurowane w tym buildzie.');
      return;
    }

    setBusy(true);
    setStatus('Sprawdzam aktualizację...');
    try {
      const result = await Updates.checkForUpdateAsync();
      if (!result.isAvailable) {
        setStatus('Masz najnowszą wersję SYSTEM-u.');
        return;
      }

      setStatus('Pobieram aktualizację...');
      await Updates.fetchUpdateAsync();
      setStatus('Aktualizacja gotowa. Restartuję SYSTEM...');
      await Updates.reloadAsync();
    } catch (error) {
      setStatus(error instanceof Error
        ? `Błąd aktualizacji: ${error.message}`
        : 'Nie udało się sprawdzić aktualizacji.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={s.panel}>
      <Text style={s.label}>SYSTEM UPDATE // OTA</Text>
      <Text style={s.title}>{status}</Text>
      <Text style={s.body}>
        Runtime {Updates.runtimeVersion ?? 'brak'} · OTA {Updates.isEnabled ? 'ON' : 'OFF'}
      </Text>
      <Text style={s.body}>
        Zmiany JS/UI/questów/kart i większości animacji mogą wejść online bez ponownej instalacji APK.
      </Text>
      <Action
        label={busy ? 'SPRAWDZAM...' : 'SPRAWDŹ AKTUALIZACJĘ'}
        disabled={busy}
        onPress={() => { void checkNow(); }}
      />
    </View>
  );
}
