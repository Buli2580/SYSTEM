import '../system2/background/locationTask';
import GameplayGate from '../system2/components/GameplayGate';
import StoryNotice from '../system2/components/StoryNotice';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {useEffect} from 'react';
import {flushAmplitude,queueTelemetry} from '../system2/telemetry/amplitude';

import { SystemProvider } from '../system2/state/SystemProvider';
import SessionGate from '../system2/components/SessionGate';
import SystemBoundary from '../system2/components/SystemBoundary';
import AwakeningCelebration from '../system2/components/AwakeningCelebration';
import RewardEventSequence from '../system2/components/RewardEventSequence';
import LaunchGate from '../system2/components/LaunchGate';
import {AnimationEngine4Provider} from '../system2/components/AnimationEngine4Provider';

export default function RootLayout() {
  useEffect(()=>{void queueTelemetry({event_type:'APP_OPEN'}).then(()=>flushAmplitude()).catch(()=>undefined)},[]);
  return (
    <SystemBoundary><AnimationEngine4Provider><SystemProvider>
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
      <SessionGate />
      <LaunchGate />
    </SystemProvider></AnimationEngine4Provider></SystemBoundary>
  );
}
