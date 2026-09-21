import { useState, type ReactNode } from 'react';
import SystemBoot from '../components/SystemBoot';
import { PresentationProvider } from './PresentationContext';
import SystemEventOverlay from './SystemEventOverlay';

export default function PresentationEngine({ children }: { children: ReactNode }) {
  const [bootComplete, setBootComplete] = useState(false);

  return (
    <PresentationProvider>
      {children}
      <SystemEventOverlay />
      {!bootComplete && <SystemBoot onComplete={() => setBootComplete(true)} />}
    </PresentationProvider>
  );
}
