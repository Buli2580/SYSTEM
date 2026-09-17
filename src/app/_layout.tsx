import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { SystemProvider } from '../system2/state/SystemProvider';

export default function RootLayout() {
  return (
    <SystemProvider>
      <StatusBar style="light" />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: '#030709',
          },
          animation: 'fade',
        }}
      />
    </SystemProvider>
  );
}