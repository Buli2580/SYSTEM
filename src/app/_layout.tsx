import { useState } from 'react';
import StoryNotice from '../system2/components/StoryNotice';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { SystemProvider } from '../system2/state/SystemProvider';
import SessionGate from '../system2/components/SessionGate';
import LevelUpCelebration from '../system2/components/LevelUpCelebration';
import SystemBoundary from '../system2/components/SystemBoundary';
import AwakeningCelebration from '../system2/components/AwakeningCelebration';
import SystemEventOverlay from '../system2/presentation/SystemEventOverlay';
import SystemBoot from '../system2/components/SystemBoot';

export default function RootLayout() {
  const [bootComplete, setBootComplete] = useState(false);

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
      <SystemEventOverlay />
      {!bootComplete && <SystemBoot onComplete={() => setBootComplete(true)} />}
    </SystemProvider></SystemBoundary>
  );
}
