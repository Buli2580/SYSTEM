/** SYSTEM Network sync/eligibility. Concrete extension seam; intentionally dependency-free. */
export const SYNC_ELIGIBILITY_MODULE='sync.eligibility' as const;
export type SyncEligibilityContext={actorId:string;now:string};
export function isSyncEligibilityContext(v:unknown):v is SyncEligibilityContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
