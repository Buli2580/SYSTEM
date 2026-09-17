// Monotonic elapsed time cannot be accelerated by changing the phone's clock.
// A run is discarded on background/blur; it is never resumed from stored time.
export function createFocusTimer(targetSeconds: number, now: () => number = () => performance.now()) {
  const startedAt = now();
  let cancelled = false;
  return {
    cancel() { cancelled = true; },
    sample() {
      const seconds = cancelled ? 0 : Math.max(0, Math.floor((now() - startedAt) / 1000));
      return { seconds, verified: !cancelled && seconds >= targetSeconds };
    },
  };
}
