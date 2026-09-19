/** SYSTEM Network offline/limits. Concrete extension seam; intentionally dependency-free. */
export const OFFLINE_LIMITS_MODULE='offline.limits' as const;
export type OfflineLimitsContext={actorId:string;now:string};
export function isOfflineLimitsContext(v:unknown):v is OfflineLimitsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
