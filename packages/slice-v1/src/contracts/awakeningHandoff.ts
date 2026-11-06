/**
 * S2 — Awakening compatibility for Codex (no host implementation here).
 */
export const AWAKENING_HANDOFF = {
  protocol: 'SLICE_V1_AWAKENING_HANDOFF',
  doNotImplementInHostByCursor: true,
  consumeExistingCompletion: {
    chapterId: 'awakening_chapter_1',
    function: 'awardAwakeningIfEligible',
    flags: ['awakeningCompleted', 'worldUnlocked', 'awakeningPending'],
  },
  proposedOnboardingStages: [
    {
      id: 1,
      name: 'WYBÓR',
      copyKey: 'selected',
      ui: 'Full-bleed SYSTEM designation, no dashboard widgets',
    },
    {
      id: 2,
      name: 'RANGA E',
      copyKey: 'rankGranted',
      ui: 'Rank E seal + Equal Origin strip (LVL 1 / XP 0 / 7 skills @ 1)',
    },
    {
      id: 3,
      name: 'PIERWSZY ROZKAZ',
      copyKey: 'firstOrderHeadline',
      ui: 'Single order card → enter first mission',
    },
    {
      id: 4,
      name: 'WEJŚCIE W MISJĘ',
      copyKey: 'firstOrderBody',
      ui: 'Hand off to existing Quest Run / QE verification — no new Unity open rules',
    },
  ],
  forbidden: [
    'New Awakening event competing with awakening_chapter_1',
    'New DEV bypass for Awakening Gate',
    'Changing Unity open conditions',
    'Fake GPS as verified proof',
  ],
  entryToFirstMission: {
    event: 'SLICE_FIRST_ORDER_ISSUED',
    after: 'awakeningConfirmed OR Codex Awakening celebration dismissed',
    questBinding: 'first_movement_v1 | safe timer path by age',
  },
} as const;
