export const DAILY_HF_CONFIG = {
  MAX_COMPLETIONS_PER_DAY: 50,
  ACTIVE_SLOTS: 5,
  XP_BUDGET: 500,
  
  XP_TIERS: {
    MICRO: { min: 2, max: 5, weight: 60 },
    SMALL: { min: 5, max: 10, weight: 25 },
    NORMAL: { min: 10, max: 20, weight: 10 },
    HARD: { min: 20, max: 40, weight: 4 },
    RARE: { min: 40, max: 75, weight: 1 },
  } as const,
  
  MILESTONES: [5, 10, 20, 30, 40, 50] as const,
  
  SLOT_REFILL_DELAY_MS: 1000,
  
  PROGRESSION_THRESHOLDS: {
    EARLY: 10,
    MID: 25,
    LATE: 40,
  } as const,
} as const;

export type XPTierKey = keyof typeof DAILY_HF_CONFIG.XP_TIERS;
export type Milestone = typeof DAILY_HF_CONFIG.MILESTONES[number];

export function getXPTierConfig(tier: XPTierKey) {
  return DAILY_HF_CONFIG.XP_TIERS[tier];
}

export function getRandomXPForTier(tier: XPTierKey): number {
  const config = DAILY_HF_CONFIG.XP_TIERS[tier];
  return Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
}

export function pickXPTier(completedCount: number): XPTierKey {
  if (completedCount < DAILY_HF_CONFIG.PROGRESSION_THRESHOLDS.EARLY) {
    return weightedPick(['MICRO', 'SMALL', 'NORMAL'], [65, 25, 10]);
  }
  if (completedCount < DAILY_HF_CONFIG.PROGRESSION_THRESHOLDS.MID) {
    return weightedPick(['MICRO', 'SMALL', 'NORMAL', 'HARD'], [55, 25, 15, 5]);
  }
  if (completedCount < DAILY_HF_CONFIG.PROGRESSION_THRESHOLDS.LATE) {
    return weightedPick(['MICRO', 'SMALL', 'NORMAL', 'HARD', 'RARE'], [50, 25, 15, 8, 2]);
  }
  return weightedPick(['MICRO', 'SMALL', 'NORMAL', 'HARD', 'RARE'], [45, 25, 15, 10, 5]);
}

function weightedPick<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) return items[i];
  }
  return items[items.length - 1];
}