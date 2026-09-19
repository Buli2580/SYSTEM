/** SYSTEM Network referral/queries. Concrete extension seam; intentionally dependency-free. */
export const REFERRAL_QUERIES_MODULE='referral.queries' as const;
export type ReferralQueriesContext={actorId:string;now:string};
export function isReferralQueriesContext(v:unknown):v is ReferralQueriesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
