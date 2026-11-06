import { defineFirstOrder, type FirstOrderDefinition, type FirstOrderPhase, type FirstOrderVariant } from '../content/firstOrder.ts';
import { orderForUtcDay, type DailyOrderTemplate } from '../content/dailyOrders.ts';
import { resolveClock } from './clock.ts';

export type SlicePhase =
  | 'NEW_PROFILE'
  | 'AWAITING_AWAKENING'
  | 'FIRST_ORDER'
  | 'BASE_UNLOCKED'
  | 'DAILY_LOOP';

export type SlicePersisted = {
  protocol: 'SLICE_V1_STATE';
  version: 1;
  phase: SlicePhase;
  awakeningConfirmed: boolean;
  firstOrder: {
    variant: FirstOrderVariant;
    phase: FirstOrderPhase;
    qeQuestId: string;
    progress: number;
    progressTarget: number;
    rewardClaimId: string | null;
  };
  baseUnlocked: boolean;
  itemGranted: boolean;
  developmentPoints: number;
  daily: {
    dayKey: string;
    timeZone: string;
    orderId: string | null;
    claimedRewardIds: string[];
    streak: number;
    lastTrustedMs: number | null;
  };
  sessionEndTeaserShown: boolean;
};

export function createInitialSliceState(timeZone = 'UTC', nowMs = Date.now()): SlicePersisted {
  const clock = resolveClock({ nowMs, timeZone });
  return {
    protocol: 'SLICE_V1_STATE',
    version: 1,
    phase: 'NEW_PROFILE',
    awakeningConfirmed: false,
    firstOrder: {
      variant: 'GPS_LOCAL',
      phase: 'LOCKED',
      qeQuestId: 'first_movement_v1',
      progress: 0,
      progressTarget: 500,
      rewardClaimId: null,
    },
    baseUnlocked: false,
    itemGranted: false,
    developmentPoints: 0,
    daily: {
      dayKey: clock.dayKey,
      timeZone,
      orderId: null,
      claimedRewardIds: [],
      streak: 0,
      lastTrustedMs: nowMs,
    },
    sessionEndTeaserShown: false,
  };
}

export function confirmAwakening(state: SlicePersisted): SlicePersisted {
  if (state.awakeningConfirmed) return state;
  return {
    ...state,
    awakeningConfirmed: true,
    phase: 'FIRST_ORDER',
    firstOrder: { ...state.firstOrder, phase: 'ISSUED' },
  };
}

export function issueFirstOrder(state: SlicePersisted, variant: FirstOrderVariant): { state: SlicePersisted; def: FirstOrderDefinition } {
  const def = defineFirstOrder(variant);
  const target =
    def.verification.minimumDistanceMeters ??
    def.verification.minimumDurationSeconds ??
    1;
  return {
    def,
    state: {
      ...state,
      phase: 'FIRST_ORDER',
      firstOrder: {
        variant,
        phase: 'ISSUED',
        qeQuestId: def.qeQuestId,
        progress: 0,
        progressTarget: target,
        rewardClaimId: null,
      },
    },
  };
}

export function startFirstOrder(state: SlicePersisted): SlicePersisted {
  if (state.firstOrder.phase !== 'ISSUED' && state.firstOrder.phase !== 'ACTIVE') return state;
  return { ...state, firstOrder: { ...state.firstOrder, phase: 'ACTIVE' } };
}

export function updateFirstOrderProgress(state: SlicePersisted, progress: number): SlicePersisted {
  if (state.firstOrder.phase !== 'ACTIVE') return state;
  return {
    ...state,
    firstOrder: {
      ...state.firstOrder,
      progress: Math.max(0, Math.min(state.firstOrder.progressTarget, progress)),
    },
  };
}

/** Mark verified only after QE adapter confirms — never on UI alone. */
export function markFirstOrderVerified(state: SlicePersisted, rewardClaimId: string): SlicePersisted {
  if (!rewardClaimId || state.firstOrder.rewardClaimId === rewardClaimId) {
    // idempotent: same claim
    if (state.firstOrder.rewardClaimId === rewardClaimId && state.firstOrder.phase === 'REWARDED') return state;
  }
  if (state.firstOrder.phase === 'REWARDED' && state.firstOrder.rewardClaimId) return state;
  return {
    ...state,
    firstOrder: { ...state.firstOrder, phase: 'VERIFIED', rewardClaimId },
  };
}

export function applyFirstOrderReward(state: SlicePersisted, rewardClaimId: string): SlicePersisted {
  if (state.firstOrder.rewardClaimId && state.firstOrder.rewardClaimId !== rewardClaimId) {
    // different claim after reward — reject double economy
    return state;
  }
  if (state.firstOrder.phase === 'REWARDED' && state.baseUnlocked) return state;
  return {
    ...state,
    firstOrder: { ...state.firstOrder, phase: 'REWARDED', rewardClaimId },
    baseUnlocked: true,
    itemGranted: true,
    developmentPoints: state.developmentPoints + 1,
    phase: 'BASE_UNLOCKED',
  };
}

export function rejectFirstOrder(state: SlicePersisted): SlicePersisted {
  return { ...state, firstOrder: { ...state.firstOrder, phase: 'REJECTED' } };
}

export function resumeSafe(state: SlicePersisted): SlicePersisted {
  // ACTIVE → remain ACTIVE; ISSUED stays; VERIFIED waits for reward apply
  return state;
}

export function rollDaily(
  state: SlicePersisted,
  nowMs: number,
  timeZone?: string,
): { state: SlicePersisted; order: DailyOrderTemplate | null; anomaly: boolean } {
  const tz = timeZone || state.daily.timeZone || 'UTC';
  const clock = resolveClock({
    nowMs,
    timeZone: tz,
    previousDayKey: state.daily.dayKey,
    lastTrustedMs: state.daily.lastTrustedMs,
  });
  if (clock.clockAnomaly) {
    return {
      anomaly: true,
      order: null,
      state: {
        ...state,
        daily: { ...state.daily, lastTrustedMs: nowMs, timeZone: tz },
      },
    };
  }
  const order = orderForUtcDay(clock.dayKey);
  let streak = state.daily.streak;
  if (clock.rolledOver) {
    streak = state.daily.orderId && state.daily.claimedRewardIds.includes(state.daily.dayKey + ':' + state.daily.orderId)
      ? streak + 1
      : 0;
  }
  return {
    anomaly: false,
    order,
    state: {
      ...state,
      phase: state.baseUnlocked ? 'DAILY_LOOP' : state.phase,
      daily: {
        dayKey: clock.dayKey,
        timeZone: tz,
        orderId: order.id,
        claimedRewardIds: state.daily.claimedRewardIds,
        streak,
        lastTrustedMs: nowMs,
      },
    },
  };
}

/** Idempotent daily reward claim key = dayKey:orderId */
export function claimDailyReward(state: SlicePersisted, claimToken: string): { state: SlicePersisted; ok: boolean; reason?: string } {
  if (!state.baseUnlocked) return { state, ok: false, reason: 'BASE_LOCKED' };
  if (!state.daily.orderId) return { state, ok: false, reason: 'NO_ORDER' };
  const key = `${state.daily.dayKey}:${state.daily.orderId}`;
  if (state.daily.claimedRewardIds.includes(key)) return { state, ok: false, reason: 'ALREADY_CLAIMED' };
  if (claimToken !== key) return { state, ok: false, reason: 'INVALID_CLAIM' };
  return {
    ok: true,
    state: {
      ...state,
      daily: {
        ...state.daily,
        claimedRewardIds: [...state.daily.claimedRewardIds, key],
      },
    },
  };
}

export function endSession(state: SlicePersisted): SlicePersisted {
  return { ...state, sessionEndTeaserShown: true };
}

export function serialize(state: SlicePersisted): string {
  return JSON.stringify(state);
}

export function deserialize(raw: string): SlicePersisted {
  const parsed = JSON.parse(raw) as SlicePersisted;
  if (parsed.protocol !== 'SLICE_V1_STATE' || parsed.version !== 1) throw new Error('SLICE_STATE_INVALID');
  return parsed;
}
