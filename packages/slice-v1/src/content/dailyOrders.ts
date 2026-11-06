import { DAILY_ORDER_TITLES } from './dialogs.pl.ts';

export type DailyOrderTemplate = {
  dayIndex: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  id: string;
  title: string;
  summary: string;
  verificationHint: 'TIMER_SHORT' | 'WALK_SHORT' | 'PRESENCE';
  /** Proposed QE reward — Codex maps to daily templates; no auto XP on app open */
  proposedRealXp: number;
  safety: string;
};

export const DAILY_ORDER_SEVEN: readonly DailyOrderTemplate[] = DAILY_ORDER_TITLES.map((title, i) => ({
  dayIndex: i as DailyOrderTemplate['dayIndex'],
  id: `slice_daily_${i + 1}`,
  title,
  summary:
    i % 3 === 0
      ? 'Krótka obecność: 8–10 minut skupienia na rozkazie. Bez wchodzenia na teren prywatny.'
      : i % 3 === 1
        ? 'Krótki bezpieczny spacer w Twojej okolicy (ok. 300–400 m). Unikaj jezdni i stref zamkniętych.'
        : 'Zanotuj jedno odkrycie w swoim mieście (publiczne miejsce). Bez współrzędnych cudzych sklepów „na ślepo”.',
  verificationHint: i % 3 === 0 ? 'TIMER_SHORT' : i % 3 === 1 ? 'WALK_SHORT' : 'PRESENCE',
  proposedRealXp: 40,
  safety: 'No trespass, no dangerous stunts, no private property.',
})) as readonly DailyOrderTemplate[];

export function orderForUtcDay(dayKey: string): DailyOrderTemplate {
  // dayKey = YYYY-MM-DD in player's resolved timezone
  const parts = dayKey.split('-').map(Number);
  const utc = Date.UTC(parts[0], parts[1] - 1, parts[2]);
  const idx = Math.floor(utc / 86_400_000) % 7;
  return DAILY_ORDER_SEVEN[idx]!;
}
