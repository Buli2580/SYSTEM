/**
 * Global day-key handling — never assume Europe/Warsaw.
 * Resilient to timezone changes; clock skew is detected, not trusted for rewards.
 */
export type ClockInput = {
  nowMs: number;
  /** IANA timezone, e.g. America/New_York — required for player-local day */
  timeZone: string;
  /** Optional previous dayKey for rollover detection */
  previousDayKey?: string | null;
  /** Max allowed device clock jump vs lastTrustedMs */
  lastTrustedMs?: number | null;
  skewToleranceMs?: number;
};

export type ClockResult = {
  dayKey: string;
  rolledOver: boolean;
  clockAnomaly: boolean;
  timeZone: string;
};

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Format YYYY-MM-DD in the given IANA zone using Intl (no Warsaw hardcode). */
export function dayKeyInTimeZone(nowMs: number, timeZone: string): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  // en-CA yields YYYY-MM-DD
  const parts = fmt.formatToParts(new Date(nowMs));
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const d = parts.find((p) => p.type === 'day')?.value;
  if (y && m && d) return `${y}-${m}-${d}`;
  const fallback = new Date(nowMs);
  return `${fallback.getUTCFullYear()}-${pad(fallback.getUTCMonth() + 1)}-${pad(fallback.getUTCDate())}`;
}

export function resolveClock(input: ClockInput): ClockResult {
  const skewToleranceMs = input.skewToleranceMs ?? 5 * 60_000;
  let clockAnomaly = false;
  if (input.lastTrustedMs != null && Number.isFinite(input.lastTrustedMs)) {
    const delta = input.nowMs - input.lastTrustedMs;
    if (delta < -skewToleranceMs || delta > 36 * 3600_000) clockAnomaly = true;
  }
  const dayKey = dayKeyInTimeZone(input.nowMs, input.timeZone || 'UTC');
  const rolledOver = !!input.previousDayKey && input.previousDayKey !== dayKey;
  return { dayKey, rolledOver, clockAnomaly, timeZone: input.timeZone || 'UTC' };
}
