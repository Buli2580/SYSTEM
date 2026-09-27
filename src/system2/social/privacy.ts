export interface SocialPrivacy { discoverable: boolean; activityVisibility: 'public'|'followers'|'private'; allowFollowRequests: boolean; }
export const DEFAULT_SOCIAL_PRIVACY: SocialPrivacy = { discoverable: true, activityVisibility: 'followers', allowFollowRequests: true };
export function normalizeSocialPrivacy(value: Partial<SocialPrivacy> | null | undefined): SocialPrivacy {
 return { ...DEFAULT_SOCIAL_PRIVACY, ...(value ?? {}) };
}
