import type { RunnableQuest } from './types';

export const PHOTO_PROOF_QUEST: RunnableQuest = {
  id: 'camera_proof_v1',
  title: 'DOWÓD DZIAŁANIA',
  description: 'Utrzymaj aktywną próbę przez chwilę i wykonaj zdjęcie bezpośrednio w SYSTEMIE. Surowe zdjęcie pozostaje lokalnie — do historii i chmury trafia wyłącznie informacja, że dowód został wykonany.',
  category: 'SIDE',
  difficulty: 'EASY',
  order: 1,
  primarySkill: 'RES',
  secondarySkills: [],
  proofMode: 'PHOTO',
  verification: {
    type: 'TIMER',
    minimumDurationSeconds: 3,
    verificationScoreRequired: 100,
  },
  rewards: {
    realXp: 40,
    skillXp: { RES: 40 },
    gameEnergy: 4,
  },
  progress: 0,
  progressTarget: 3,
  createdAt: '2026-09-22T00:00:00.000Z',
  chapter: 1,
  arc: 'CAMERA_PROTOCOL',
};
