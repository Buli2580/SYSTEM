/** SYSTEM Network referral/state. Concrete extension seam; intentionally dependency-free. */
export const REFERRAL_STATE_MODULE='referral.state' as const;
export type ReferralStateContext={actorId:string;now:string};
export function isReferralStateContext(v:unknown):v is ReferralStateContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
