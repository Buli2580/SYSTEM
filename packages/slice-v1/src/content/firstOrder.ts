import { FIRST_ORDER_COPY } from './dialogs.pl.ts';
import { SLICE_REWARD_PROPOSAL } from './rewards.ts';

export type FirstOrderVariant = 'GPS_LOCAL' | 'LEBORK_PILOT' | 'TIMER_FLEX' | 'DEV_HARNESS';
export type FirstOrderPhase = 'LOCKED' | 'ISSUED' | 'ACTIVE' | 'SUBMITTED' | 'VERIFIED' | 'REWARDED' | 'REJECTED';

export type FirstOrderDefinition = {
  contentId: string;
  title: string;
  qeQuestId: string;
  variant: FirstOrderVariant;
  verification: {
    type: 'GPS_DISTANCE' | 'TIMER' | 'DEV_SIMULATED_PATH';
    minimumDistanceMeters?: number;
    minimumDurationSeconds?: number;
    verificationScoreRequired: number;
    /** DEV must not claim physical proof */
    producesRealWorldProof: boolean;
  };
  instruction: string;
  rewardProposal: typeof SLICE_REWARD_PROPOSAL.firstOrder;
};

/** Pilot POI — Lębork landmark flavor only; completion must not require presence. */
export const LEBORK_PILOT_POI = {
  name: 'Ratusz — Lębork (pilot)',
  lat: 54.5394,
  lon: 17.7505,
  note: 'Optional mission marker for pilot city. GPS_LOCAL variant completes without arriving here.',
} as const;

export function defineFirstOrder(variant: FirstOrderVariant = 'GPS_LOCAL'): FirstOrderDefinition {
  const base = {
    contentId: FIRST_ORDER_COPY.id,
    title: FIRST_ORDER_COPY.title,
    rewardProposal: SLICE_REWARD_PROPOSAL.firstOrder,
  };
  switch (variant) {
    case 'LEBORK_PILOT':
      return {
        ...base,
        qeQuestId: 'first_movement_v1',
        variant,
        verification: {
          type: 'GPS_DISTANCE',
          minimumDistanceMeters: 500,
          verificationScoreRequired: 80,
          producesRealWorldProof: true,
        },
        instruction: FIRST_ORDER_COPY.instructionLeborkPilot,
      };
    case 'TIMER_FLEX':
      return {
        ...base,
        /** Align with safe/timer QE path — Codex may bind to safe awakening stage 1 or dedicated TIMER quest */
        qeQuestId: 'safe_awakening_focus_v1',
        variant,
        verification: {
          type: 'TIMER',
          minimumDurationSeconds: 300,
          verificationScoreRequired: 100,
          producesRealWorldProof: true,
        },
        instruction: FIRST_ORDER_COPY.instructionTimerFlex,
      };
    case 'DEV_HARNESS':
      return {
        ...base,
        qeQuestId: 'first_movement_v1',
        variant,
        verification: {
          type: 'DEV_SIMULATED_PATH',
          verificationScoreRequired: 100,
          producesRealWorldProof: false,
        },
        instruction: FIRST_ORDER_COPY.instructionDev,
      };
    case 'GPS_LOCAL':
    default:
      return {
        ...base,
        qeQuestId: 'first_movement_v1',
        variant: 'GPS_LOCAL',
        verification: {
          type: 'GPS_DISTANCE',
          minimumDistanceMeters: 500,
          verificationScoreRequired: 80,
          producesRealWorldProof: true,
        },
        instruction: FIRST_ORDER_COPY.instructionGps,
      };
  }
}

export function selectVariant(input: {
  hasGps: boolean;
  nearLeborkPilot?: boolean;
  preferSafeTimer?: boolean;
  isDev?: boolean;
}): FirstOrderVariant {
  if (input.isDev) return 'DEV_HARNESS';
  if (input.preferSafeTimer || !input.hasGps) return 'TIMER_FLEX';
  if (input.nearLeborkPilot) return 'LEBORK_PILOT';
  return 'GPS_LOCAL';
}
