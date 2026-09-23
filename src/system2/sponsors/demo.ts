import type { SponsorChallenge } from './contracts';

export const DEMO_SPONSOR_CHALLENGES: SponsorChallenge[] = [
  {
    id: 'demo-steps-7d',
    sponsor: { id: 'demo-brand', name: 'Partner SYSTEM', disclosureLabel: 'ZADANIE SPONSOROWANE' },
    title: 'Marsz po nagrodę',
    description: 'Zdobądź zweryfikowane kroki i odblokuj nagrodę partnera.',
    tier: 'free',
    status: 'draft',
    startsAt: '2026-01-01T00:00:00.000Z',
    endsAt: '2027-01-01T00:00:00.000Z',
    verification: 'steps',
    target: 50000,
    unit: 'steps',
    rewards: [{ kind: 'xp', label: '+500 XP', value: 500 }]
  },
  {
    id: 'demo-premium-workout',
    sponsor: { id: 'demo-premium-brand', name: 'Partner Premium', disclosureLabel: 'PREMIUM // SPONSOR' },
    title: 'Boss treningowy',
    description: 'Wykonaj 180 zweryfikowanych minut aktywności.',
    tier: 'premium',
    status: 'draft',
    startsAt: '2026-01-01T00:00:00.000Z',
    endsAt: '2027-01-01T00:00:00.000Z',
    verification: 'workout',
    target: 180,
    unit: 'minutes',
    rewards: [{ kind: 'badge', label: 'Odznaka Partnera' }]
  }
];
