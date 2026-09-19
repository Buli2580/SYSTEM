/** SYSTEM Network sync/limits. Concrete extension seam; intentionally dependency-free. */
export const SYNC_LIMITS_MODULE='sync.limits' as const;
export type SyncLimitsContext={actorId:string;now:string};
export function isSyncLimitsContext(v:unknown):v is SyncLimitsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
