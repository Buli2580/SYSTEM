import { useEffect, useState, type ReactNode } from 'react';
import SystemBoot from '../components/SystemBoot';
import { AudioProvider } from '../audio/AudioEngine';
import PresentationAudioBridge from '../audio/PresentationAudioBridge';
import { PresentationProvider } from './PresentationContext';
import { PresentationEventPresets, presentationEventBus } from './PresentationEvents';
import SystemEventOverlay from './SystemEventOverlay';

function PresentationLifecycle() {
  useEffect(() => {
    presentationEventBus.emit(PresentationEventPresets.systemBoot());
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
        <PresentationLifecycle />
        <PresentationAudioBridge />
        {children}
        <SystemEventOverlay />
        {!bootComplete && <SystemBoot onComplete={finishBoot} />}
      </PresentationProvider>
    </AudioProvider>
  );
}
