import type { ReactNode } from 'react';
import { useSystem } from '../state/SystemProvider';
// Navigator stays mounted; gameplay screens cannot start effects before a valid session.
export default function GameplayGate({ children }: { children: ReactNode }) {
  const { ready, onboardingComplete } = useSystem();
  return ready && onboardingComplete ? <>{children}</> : null;
}
