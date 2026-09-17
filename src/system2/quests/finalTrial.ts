import type { RunnableQuest } from './types';

export const FINAL_TRIAL_QUEST: RunnableQuest = {
  id: 'final_trial_v1', title: 'FINAL TRIAL',
  description: 'Przejdź 600 metrów i utrzymaj aktywną próbę przez co najmniej 10 minut. SYSTEM wymaga obu warunków. Pozostaw ekran misji otwarty i GPS włączony.',
  category: 'MAIN', difficulty: 'NORMAL', order: 3,
  primarySkill: 'VIT', secondarySkills: ['WIL'],
  verification: {
    type: 'MULTI', minimumDistanceMeters: 600, minimumDurationSeconds: 600, verificationScoreRequired: 80,
  },
  rewards: { realXp: 120, skillXp: { VIT: 60, WIL: 60 }, gameEnergy: 15 },
  progress: 0, progressTarget: 600, createdAt: '2026-09-17T00:00:00.000Z', chapter: 1, arc: 'AWAKENING',
};
