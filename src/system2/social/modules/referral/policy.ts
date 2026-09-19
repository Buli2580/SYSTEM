/** SYSTEM Network referral/policy. Concrete extension seam; intentionally dependency-free. */
export const REFERRAL_POLICY_MODULE='referral.policy' as const;
export type ReferralPolicyContext={actorId:string;now:string};
export function isReferralPolicyContext(v:unknown):v is ReferralPolicyContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
