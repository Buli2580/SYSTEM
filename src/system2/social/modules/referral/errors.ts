/** SYSTEM Network referral/errors. Concrete extension seam; intentionally dependency-free. */
export const REFERRAL_ERRORS_MODULE='referral.errors' as const;
export type ReferralErrorsContext={actorId:string;now:string};
export function isReferralErrorsContext(v:unknown):v is ReferralErrorsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
