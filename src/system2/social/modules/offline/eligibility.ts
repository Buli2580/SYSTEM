/** SYSTEM Network offline/eligibility. Concrete extension seam; intentionally dependency-free. */
export const OFFLINE_ELIGIBILITY_MODULE='offline.eligibility' as const;
export type OfflineEligibilityContext={actorId:string;now:string};
export function isOfflineEligibilityContext(v:unknown):v is OfflineEligibilityContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
