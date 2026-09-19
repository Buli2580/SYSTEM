/** SYSTEM Network referral/repository. Concrete extension seam; intentionally dependency-free. */
export const REFERRAL_REPOSITORY_MODULE='referral.repository' as const;
export type ReferralRepositoryContext={actorId:string;now:string};
export function isReferralRepositoryContext(v:unknown):v is ReferralRepositoryContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
