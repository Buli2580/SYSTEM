import type { RunnableQuest } from './types';

export const FOCUS_PROTOCOL_QUEST: RunnableQuest = {
  id: 'focus_protocol_v1',
  title: 'FOCUS PROTOCOL',
  description: 'Skup się przez 10 minut bez przerwy. Pozostaw aplikację na pierwszym planie i ekran misji otwarty. Przejście do tła lub wyjście z misji przerywa próbę.',
  category: 'MAIN', difficulty: 'EASY', order: 2, primarySkill: 'WIL', secondarySkills: [],
  verification: { type: 'TIMER', minimumDurationSeconds: 600, verificationScoreRequired: 100 },
  rewards: { realXp: 80, skillXp: { WIL: 70 }, gameEnergy: 8 },
  progress: 0, progressTarget: 600,
  createdAt: '2026-09-17T00:00:00.000Z', chapter: 1, arc: 'AWAKENING',
};
