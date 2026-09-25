import type { SponsorChallenge, SponsorChallengeTier } from './contracts';
import { challengeIsAvailable, canEnterSponsorChallenge } from './engine';

export interface SponsorChallengeFilters {
  tier?: SponsorChallengeTier;
  verification?: SponsorChallenge['verification'];
  availableOnly?: boolean;
}

export function filterSponsorChallenges(
  challenges: SponsorChallenge[],
  filters: SponsorChallengeFilters,
  hasPremium: boolean,
  now = new Date(),
): SponsorChallenge[] {
  return challenges
    .filter(item => !filters.tier || item.tier === filters.tier)
    .filter(item => !filters.verification || item.verification === filters.verification)
    .filter(item => !filters.availableOnly || challengeIsAvailable(item, now))
    .filter(item => canEnterSponsorChallenge(item, hasPremium))
    .sort((a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime());
}
