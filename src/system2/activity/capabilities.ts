import type { ExternalActivityEvidenceProvider, VerificationStrength } from './types';
// expo-sensors is absent from dependencies and the current Android autolinking resolution. No fabricated samples.
export const phoneProvider: ExternalActivityEvidenceProvider = {
 source: 'PHONE', capabilities: { gps: true, steps: false, motion: false, watch: false },
 async start() { return { summary: () => ({}), remove() {} }; },
};
export function supportsStrength(strength: VerificationStrength, caps = phoneProvider.capabilities) {
 return caps.gps && (strength === 'STANDARD' || (caps.steps && caps.motion && (strength !== 'STRICT' || caps.watch)));
}
