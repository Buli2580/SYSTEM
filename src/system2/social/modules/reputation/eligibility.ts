/** SYSTEM Network reputation/eligibility. Concrete extension seam; intentionally dependency-free. */
export const REPUTATION_ELIGIBILITY_MODULE='reputation.eligibility' as const;
export type ReputationEligibilityContext={actorId:string;now:string};
export function isReputationEligibilityContext(v:unknown):v is ReputationEligibilityContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
