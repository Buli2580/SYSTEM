// performance.now() remains the anti-clock-tampering source while the process lives.
// initialSeconds lets an active MULTI quest continue after a background GPS handoff.
export function createFocusTimer(
  targetSeconds: number,
  now: () => number = () => performance.now(),
  initialSeconds = 0,
) {
  const startedAt = now();
  const base = Number.isFinite(initialSeconds) && initialSeconds > 0 ? Math.floor(initialSeconds) : 0;
  let cancelled = false;
  return {
    cancel() { cancelled = true; },
    sample() {
      const seconds = cancelled ? 0 : base + Math.max(0, Math.floor((now() - startedAt) / 1000));
      return { seconds, verified: !cancelled && seconds >= targetSeconds };
    },
  };
}
