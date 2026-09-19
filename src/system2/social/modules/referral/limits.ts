/** SYSTEM Network referral/limits. Concrete extension seam; intentionally dependency-free. */
export const REFERRAL_LIMITS_MODULE='referral.limits' as const;
export type ReferralLimitsContext={actorId:string;now:string};
export function isReferralLimitsContext(v:unknown):v is ReferralLimitsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
