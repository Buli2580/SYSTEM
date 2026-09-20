import type { GlobalFeature, LocaleCode, RuntimeCapabilities } from '../platform/contracts';

const disabled: Record<GlobalFeature, boolean> = {
  cloudSync: false,
  aiGameMaster: false,
  healthVerification: false,
  social: false,
  guilds: false,
  premium: false,
  sponsoredChallenges: false,
  analytics: false,
};

export function createRuntimeCapabilities(
  locale: LocaleCode = 'pl-PL',
  region = 'PL',
  overrides: Partial<Record<GlobalFeature, boolean>> = {},
): RuntimeCapabilities {
  return { locale, region, features: { ...disabled, ...overrides } };
}

export const defaultCapabilities = createRuntimeCapabilities();
