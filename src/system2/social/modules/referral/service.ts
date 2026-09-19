/** SYSTEM Network referral/service. Concrete extension seam; intentionally dependency-free. */
export const REFERRAL_SERVICE_MODULE='referral.service' as const;
export type ReferralServiceContext={actorId:string;now:string};
export function isReferralServiceContext(v:unknown):v is ReferralServiceContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
