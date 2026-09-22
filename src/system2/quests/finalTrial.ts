import type { RunnableQuest } from './types';

export const FINAL_TRIAL_QUEST: RunnableQuest = {
  id: 'final_trial_v1', title: 'OSTATNIA PRÓBA',
  description: 'Przejdź 600 metrów i utrzymaj aktywną próbę przez co najmniej 10 minut. SYSTEM wymaga obu warunków. GPS może działać w tle — możesz wygasić ekran lub przejść do innej aplikacji.',
  category: 'MAIN', difficulty: 'NORMAL', order: 3,
  primarySkill: 'VIT', secondarySkills: ['WIL'],
  proofMode: 'GPS_TIME_PHOTO',
  verification: {
    type: 'MULTI', minimumDistanceMeters: 600, minimumDurationSeconds: 600, verificationScoreRequired: 80,
  },
  rewards: { realXp: 120, skillXp: { VIT: 60, WIL: 60 }, gameEnergy: 15 },
  progress: 0, progressTarget: 600, createdAt: '2026-09-17T00:00:00.000Z', chapter: 1, arc: 'AWAKENING',
};
