/** SYSTEM Network sync/audit. Concrete extension seam; intentionally dependency-free. */
export const SYNC_AUDIT_MODULE='sync.audit' as const;
export type SyncAuditContext={actorId:string;now:string};
export function isSyncAuditContext(v:unknown):v is SyncAuditContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
