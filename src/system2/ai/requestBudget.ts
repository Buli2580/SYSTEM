export const AI_RETRY_COOLDOWN_MS = 60_000;

export function aiRetryRemainingMs(
  lastRequestAt: number,
  now = Date.now(),
  cooldownMs = AI_RETRY_COOLDOWN_MS,
) {
  if (!Number.isFinite(lastRequestAt) || lastRequestAt <= 0) return 0;
  const safeNow = Number.isFinite(now) ? now : lastRequestAt;
  const safeCooldown = Number.isFinite(cooldownMs) && cooldownMs > 0
    ? cooldownMs
    : AI_RETRY_COOLDOWN_MS;
  const elapsed = Math.max(0, safeNow - lastRequestAt);
  return Math.max(0, safeCooldown - elapsed);
}
