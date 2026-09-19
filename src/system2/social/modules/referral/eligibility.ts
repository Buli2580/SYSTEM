/** SYSTEM Network referral/eligibility. Concrete extension seam; intentionally dependency-free. */
export const REFERRAL_ELIGIBILITY_MODULE='referral.eligibility' as const;
export type ReferralEligibilityContext={actorId:string;now:string};
export function isReferralEligibilityContext(v:unknown):v is ReferralEligibilityContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
