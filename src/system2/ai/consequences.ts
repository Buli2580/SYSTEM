export type SystemDebt = 0 | 1 | 2 | 3;

export interface ConsequenceState {
  systemDebt: SystemDebt;
  xpMultiplier: number;
  needsRecoveryQuest: boolean;
  message: string;
}

const MULTIPLIER: Record<SystemDebt, number> = {
  0: 1,
  1: 0.9,
  2: 0.8,
  3: 0.7,
};

export function consequenceForFailedDaily(
  currentDebt: SystemDebt,
  consecutiveFails: number
): ConsequenceState {
  const failCount = Number.isFinite(consecutiveFails)
    ? Math.max(0, Math.floor(consecutiveFails))
    : 0;
  const increase = failCount >= 3 ? 2 : failCount > 0 ? 1 : 0;
  const next = Math.min(3, currentDebt + increase) as SystemDebt;

  return {
    systemDebt: next,
    xpMultiplier: MULTIPLIER[next],
    needsRecoveryQuest: next > 0,
    message:
      next === 0
        ? 'SYSTEM działa bez aktywnego długu.'
        : next === 1
          ? 'SYSTEM DEBT I aktywny. Ukończ Recovery Mission, aby przywrócić pełną synchronizację.'
          : `SYSTEM DEBT ${next} aktywny. Priorytet: Recovery Mission.`,
  };
}

export function consequenceForRecoverySuccess(): ConsequenceState {
  return {
    systemDebt: 0,
    xpMultiplier: 1,
    needsRecoveryQuest: false,
    message: 'Synchronizacja przywrócona. SYSTEM DEBT usunięty.',
  };
}

export function getXpMultiplier(debt: SystemDebt): number {
  return MULTIPLIER[debt];
}
