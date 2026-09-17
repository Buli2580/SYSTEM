import { Quest } from '../core';

export const FIRST_MOVEMENT_QUEST: Quest = {
  id: 'first_movement_v1',

  title: 'PIERWSZY RUCH',

  description:
    'Przejdź 500 metrów. SYSTEM będzie mierzył rzeczywisty dystans za pomocą GPS.',

  // Jednorazowy quest rozdziału Awakening; stały id jest kluczem ukończenia.
  category: 'MAIN',

  difficulty: 'EASY',

  status: 'AVAILABLE',

  primarySkill: 'VIT',

  verification: {
    type: 'GPS_DISTANCE',

    minimumDistanceMeters: 500,

    verificationScoreRequired: 80,
  },

  rewards: {
    realXp: 100,

    skillXp: {
      VIT: 80,
    },

    gameEnergy: 10,
  },

  progress: 0,
  progressTarget: 500,

  createdAt: new Date().toISOString(),

  chapter: 1,
  arc: 'AWAKENING',
};