import '../system2/background/locationTask';
import GameplayGate from '../system2/components/GameplayGate';
import StoryNotice from '../system2/components/StoryNotice';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { SystemProvider } from '../system2/state/SystemProvider';
import SessionGate from '../system2/components/SessionGate';
import LevelUpCelebration from '../system2/components/LevelUpCelebration';
import SystemBoundary from '../system2/components/SystemBoundary';
import AwakeningCelebration from '../system2/components/AwakeningCelebration';
import PresentationEngine from '../system2/presentation/PresentationEngine';

export default function RootLayout() {
  return (
    <SystemBoundary><SystemProvider><PresentationEngine>
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
      <LevelUpCelebration />
      <StoryNotice />
      <SessionGate />
    </PresentationEngine></SystemProvider></SystemBoundary>
  );
}
