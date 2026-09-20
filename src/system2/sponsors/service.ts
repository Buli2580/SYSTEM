import type { SponsorChallenge, SponsorChallengeProgress } from './contracts';
import { challengeIsAvailable, canEnterSponsorChallenge, sponsorChallengeCompleted } from './engine';

export type SponsorJoinResult =
  | { ok: true; progress: SponsorChallengeProgress }
  | { ok: false; reason: 'not_active' | 'premium_required' };

export function joinSponsorChallenge(
  challenge: SponsorChallenge,
  userId: string,
  hasPremium: boolean,
  now = new Date(),
): SponsorJoinResult {
  if (!challengeIsAvailable(challenge, now)) return { ok: false, reason: 'not_active' };
  if (!canEnterSponsorChallenge(challenge, hasPremium)) return { ok: false, reason: 'premium_required' };
  return {
    ok: true,
    progress: { challengeId: challenge.id, userId, value: 0, verifiedValue: 0 },
  };
}

export function applyVerifiedSponsorProgress(
  challenge: SponsorChallenge,
  progress: SponsorChallengeProgress,
  verifiedDelta: number,
  occurredAt = new Date().toISOString(),
): SponsorChallengeProgress {
  const next = Math.max(progress.verifiedValue, progress.verifiedValue + Math.max(0, verifiedDelta));
  const updated = { ...progress, value: Math.max(progress.value, next), verifiedValue: next };
  return sponsorChallengeCompleted(challenge, updated) && !updated.completedAt
    ? { ...updated, completedAt: occurredAt }
    : updated;
}
