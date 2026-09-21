import { useEffect, useState, type ReactNode } from 'react';
import SystemBoot from '../components/SystemBoot';
import { AudioProvider } from '../audio/AudioEngine';
import PresentationAudioBridge from '../audio/PresentationAudioBridge';
import { PresentationProvider } from './PresentationContext';
import { PresentationEventPresets, presentationEventBus } from './PresentationEvents';
import SystemEventOverlay from './SystemEventOverlay';
import PresentationHapticsBridge from './PresentationHapticsBridge';
import { HeroCardsProvider } from '../heroes/runtime';

function PresentationLifecycle() {
  useEffect(() => {
    const timer = setTimeout(() => {
      presentationEventBus.emit(PresentationEventPresets.systemBoot());
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  return null;
}

export default function PresentationEngine({ children }: { children: ReactNode }) {
  const [bootComplete, setBootComplete] = useState(false);

  const finishBoot = () => {
    setBootComplete(true);
    presentationEventBus.emit(PresentationEventPresets.systemReady());
  };

  return (
    <AudioProvider>
      <PresentationProvider>
        <HeroCardsProvider>
          <PresentationLifecycle />
          <PresentationAudioBridge />
          <PresentationHapticsBridge />
          {children}
          <SystemEventOverlay />
          {!bootComplete && <SystemBoot onComplete={finishBoot} />}
        </HeroCardsProvider>
      </PresentationProvider>
    </AudioProvider>
  );
}
