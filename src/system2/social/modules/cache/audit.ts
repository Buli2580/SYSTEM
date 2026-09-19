/** SYSTEM Network cache/audit. Concrete extension seam; intentionally dependency-free. */
export const CACHE_AUDIT_MODULE='cache.audit' as const;
export type CacheAuditContext={actorId:string;now:string};
export function isCacheAuditContext(v:unknown):v is CacheAuditContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
