// Use monotonic elapsed time for MOVE credit. Calendar time is metadata only.
// This clock is intentionally in-memory; process-death recovery requires a
// separate persisted session protocol and must never infer elapsed activity.
export type MoveSessionClock = {
  readonly startedAtWallMs: number;
  readonly startedAtMonotonicMs: number;
};

export function createMoveSessionClock(wallMs: number, monotonicMs: number): MoveSessionClock {
  if (!Number.isFinite(wallMs) || !Number.isFinite(monotonicMs) || wallMs < 0 || monotonicMs < 0) {
    throw new Error('MOVE_INVALID_START_CLOCK');
  }
  return { startedAtWallMs: wallMs, startedAtMonotonicMs: monotonicMs };
}

export function moveElapsedMs(clock: MoveSessionClock, monotonicNowMs: number): number {
  if (!Number.isFinite(monotonicNowMs) || monotonicNowMs < clock.startedAtMonotonicMs) {
    throw new Error('MOVE_MONOTONIC_CLOCK_RESET');
  }
  return Math.floor(monotonicNowMs - clock.startedAtMonotonicMs);
}

// Construct a consistent health-query end boundary even when the calendar
// clock is manually changed during a running MOVE session.
export function moveWallEndMs(clock: MoveSessionClock, monotonicNowMs: number): number {
  return clock.startedAtWallMs + moveElapsedMs(clock, monotonicNowMs);
}
