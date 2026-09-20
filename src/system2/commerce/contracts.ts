export type SubscriptionTier = 'free' | 'premium';

export interface Entitlement {
  tier: SubscriptionTier;
  validUntil?: string;
  source: 'store' | 'promo' | 'admin';
}

export interface SponsorCampaign {
  id: string;
  sponsorId: string;
  title: string;
  regions: string[];
  startsAt: string;
  endsAt: string;
  rewardDescription: string;
  maxParticipants?: number;
  premiumOnly: boolean;
}

export interface SponsoredChallenge {
  id: string;
  campaignId: string;
  title: string;
  description: string;
  verification: 'self' | 'health' | 'location' | 'photo';
  rewardDescription: string;
}
