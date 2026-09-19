/** SYSTEM Network referral/lifecycle. Concrete extension seam; intentionally dependency-free. */
export const REFERRAL_LIFECYCLE_MODULE='referral.lifecycle' as const;
export type ReferralLifecycleContext={actorId:string;now:string};
export function isReferralLifecycleContext(v:unknown):v is ReferralLifecycleContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
