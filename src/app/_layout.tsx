import '../system2/background/locationTask';
import GameplayGate from '../system2/components/GameplayGate';
import StoryNotice from '../system2/components/StoryNotice';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { SystemProvider } from '../system2/state/SystemProvider';
import SessionGate from '../system2/components/SessionGate';
import SystemBoundary from '../system2/components/SystemBoundary';
import AwakeningCelebration from '../system2/components/AwakeningCelebration';
import RewardEventSequence from '../system2/components/RewardEventSequence';
import LaunchGate from '../system2/components/LaunchGate';

export default function RootLayout() {
  return (
    <SystemBoundary><SystemProvider>
      <StatusBar style="light" />

      <Stack
        screenLayout={({ children }) => <GameplayGate>{children}</GameplayGate>}
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: '#030709',
          },
          animation: 'fade',
        }}
      />
      <AwakeningCelebration />
      <RewardEventSequence />
      <StoryNotice />
      <LaunchGate />
      <SessionGate />
    </SystemProvider></SystemBoundary>
  );
}
