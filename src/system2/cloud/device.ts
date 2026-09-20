import { Platform } from 'react-native';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DeviceRegistration } from '../backend/contracts';

const INSTALL_KEY = '@system/install-id/v1';

function randomId(): string {
  return 'install-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
}

export async function deviceRegistration(): Promise<DeviceRegistration> {
  let deviceId = await AsyncStorage.getItem(INSTALL_KEY);
  if (!deviceId) { deviceId = randomId(); await AsyncStorage.setItem(INSTALL_KEY, deviceId); }
  const platform = Platform.OS === 'ios' || Platform.OS === 'android' || Platform.OS === 'web' ? Platform.OS : 'web';
  return {
    deviceId, platform, appVersion: Application.nativeApplicationVersion ?? 'dev',
    locale: Intl.DateTimeFormat().resolvedOptions().locale || 'pl-PL',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    lastSeenAt: new Date().toISOString(),
  };
}
