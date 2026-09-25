export function attemptWasSuspicious(payload: string) {
  try { return JSON.parse(payload)?.activity?.verdict === 'SUSPICIOUS'; }
  catch { return false; }
}
