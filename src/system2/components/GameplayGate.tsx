import type { ReactNode } from 'react';
import { useSystem } from '../state/SystemProvider';

// Keep the navigator mounted, but never mount gameplay effects behind mandatory
// first-run gates. After the first goal exists, Awakening quests may run normally.
export default function GameplayGate({ children }: { children: ReactNode }) {
  const { ready, onboardingComplete, awakeningCompleted, goals } = useSystem();
  const firstGoalPending = ready && onboardingComplete && !awakeningCompleted && goals.length === 0;
  return ready && onboardingComplete && !firstGoalPending ? <>{children}</> : null;
}
