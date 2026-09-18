import { resetSystemData } from '../storage/database';

/** Development-only core entry point. No production flag can be supplied by the caller.
 * UI integration must refresh its snapshot and process the existing avatar cleanup marker.
 * This clears local gameplay only; original gallery files are never touched.
 */
export function resetTesterProfile(confirmation: string) {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return Promise.reject(new Error('Tester reset is disabled in production.'));
  if (confirmation !== 'RESET TESTER PROFILE') return Promise.reject(new Error('Explicit tester reset confirmation required.'));
  return resetSystemData(true);
}
