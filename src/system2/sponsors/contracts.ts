export type SponsorChallengeTier = 'free' | 'premium';
export type SponsorChallengeStatus = 'draft' | 'scheduled' | 'active' | 'ended';

export interface SponsorBrand {
  id: string;
  name: string;
  logoUrl?: string;
  disclosureLabel: string;
}

export interface SponsorReward {
  kind: 'badge' | 'coupon' | 'physical' | 'cash' | 'cosmetic';
  label: string;
  value?: number;
  currency?: string;
  inventory?: number;
}

export interface SponsorChallenge {
  id: string;
  sponsor: SponsorBrand;
  title: string;
  description: string;
  tier: SponsorChallengeTier;
  status: SponsorChallengeStatus;
  startsAt: string;
  endsAt: string;
  maxParticipants?: number;
  verification: 'self' | 'steps' | 'workout' | 'photo' | 'location';
  target: number;
  unit: 'count' | 'steps' | 'minutes' | 'km';
  rewards: SponsorReward[];
  rulesUrl?: string;
}

export interface SponsorChallengeProgress {
  challengeId: string;
  userId: string;
  value: number;
  verifiedValue: number;
  completedAt?: string;
  rewardClaimedAt?: string;
}
