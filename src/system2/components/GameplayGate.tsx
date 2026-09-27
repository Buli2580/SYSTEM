import type { ReactNode } from 'react';
import { useSystem } from '../state/SystemProvider';
import { firstGoalGatePending } from '../beta/experience';

// Keep the navigator mounted, but never mount gameplay effects behind mandatory
// first-run gates. After the first goal exists, Awakening quests may run normally.
export default function GameplayGate({ children }: { children: ReactNode }) {
  const { ready, onboardingComplete, awakeningCompleted, goals } = useSystem();
  const firstGoalPending = firstGoalGatePending({ ready, onboardingComplete, awakeningCompleted, goalCount: goals.length });
  return ready && onboardingComplete && !firstGoalPending ? <>{children}</> : null;
}
