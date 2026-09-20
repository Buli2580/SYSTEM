import { Alert } from 'react-native';
import * as Location from 'expo-location';

export const BACKGROUND_LOCATION_DISCLOSURE =
  'SYSTEM zbiera dane o lokalizacji, aby mierzyć dystans i weryfikować aktywne misje ruchowe także w tle, gdy ekran jest wygaszony albo aplikacja nie jest używana. Lokalizacja nie jest używana do reklam. SYSTEM nie wysyła do chmury pełnej historii trasy GPS — synchronizowane są wyłącznie zagregowane dane potrzebne do weryfikacji misji.';

export async function confirmBackgroundLocationDisclosure(): Promise<boolean> {
  const permission = await Location.getBackgroundPermissionsAsync();
  if (permission.status === 'granted') return true;

  return new Promise(resolve => {
    let settled = false;
    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    Alert.alert(
      'LOKALIZACJA W TLE',
      BACKGROUND_LOCATION_DISCLOSURE,
      [
        { text: 'NIE TERAZ', style: 'cancel', onPress: () => finish(false) },
        { text: 'KONTYNUUJ', onPress: () => finish(true) },
      ],
      { cancelable: true, onDismiss: () => finish(false) },
    );
  });
}
