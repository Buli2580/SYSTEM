import type { SponsorChallenge, SponsorChallengeProgress, SponsorReward } from './contracts';

export function challengeIsAvailable(challenge: SponsorChallenge, now = new Date()): boolean {
  const time = now.getTime();
  return challenge.status === 'active' &&
    time >= new Date(challenge.startsAt).getTime() &&
    time <= new Date(challenge.endsAt).getTime();
}

export function canEnterSponsorChallenge(challenge: SponsorChallenge, hasPremium: boolean): boolean {
  return challenge.tier === 'free' || hasPremium;
}

export function sponsorChallengePercent(challenge: SponsorChallenge, progress: SponsorChallengeProgress): number {
  if (challenge.target <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round((progress.verifiedValue / challenge.target) * 100)));
}

export function sponsorChallengeCompleted(challenge: SponsorChallenge, progress: SponsorChallengeProgress): boolean {
  return progress.verifiedValue >= challenge.target;
}

export function availableRewards(challenge: SponsorChallenge): SponsorReward[] {
  return challenge.rewards.filter(reward => reward.inventory === undefined || reward.inventory > 0);
}
