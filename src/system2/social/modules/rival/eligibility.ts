/** SYSTEM Network rival/eligibility. Concrete extension seam; intentionally dependency-free. */
export const RIVAL_ELIGIBILITY_MODULE='rival.eligibility' as const;
export type RivalEligibilityContext={actorId:string;now:string};
export function isRivalEligibilityContext(v:unknown):v is RivalEligibilityContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
