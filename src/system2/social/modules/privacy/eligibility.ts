/** SYSTEM Network privacy/eligibility. Concrete extension seam; intentionally dependency-free. */
export const PRIVACY_ELIGIBILITY_MODULE='privacy.eligibility' as const;
export type PrivacyEligibilityContext={actorId:string;now:string};
export function isPrivacyEligibilityContext(v:unknown):v is PrivacyEligibilityContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
