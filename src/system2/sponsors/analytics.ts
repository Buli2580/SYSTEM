export type SponsorAnalyticsEvent =
  | { name: 'sponsor_challenge_impression'; challengeId: string; sponsorId: string }
  | { name: 'sponsor_challenge_opened'; challengeId: string; sponsorId: string }
  | { name: 'sponsor_challenge_joined'; challengeId: string; sponsorId: string }
  | { name: 'sponsor_challenge_completed'; challengeId: string; sponsorId: string }
  | { name: 'sponsor_reward_claimed'; challengeId: string; sponsorId: string; rewardKind: string };

export interface SponsorCampaignMetrics {
  impressions: number;
  opens: number;
  joins: number;
  completions: number;
  rewardClaims: number;
}

export function sponsorConversion(metrics: SponsorCampaignMetrics) {
  const rate = (n: number, d: number) => d > 0 ? n / d : 0;
  return {
    openRate: rate(metrics.opens, metrics.impressions),
    joinRate: rate(metrics.joins, metrics.opens),
    completionRate: rate(metrics.completions, metrics.joins),
    claimRate: rate(metrics.rewardClaims, metrics.completions),
  };
}
