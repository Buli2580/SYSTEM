import StoryNotice from '../system2/components/StoryNotice';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { SystemProvider } from '../system2/state/SystemProvider';
import SessionGate from '../system2/components/SessionGate';
import LevelUpCelebration from '../system2/components/LevelUpCelebration';
import SystemBoundary from '../system2/components/SystemBoundary';
import AwakeningCelebration from '../system2/components/AwakeningCelebration';

export default function RootLayout() {
  return (
    <SystemBoundary><SystemProvider>
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
      <AwakeningCelebration />
      <LevelUpCelebration />
      <StoryNotice />
      <SessionGate />
    </SystemProvider></SystemBoundary>
  );
}
