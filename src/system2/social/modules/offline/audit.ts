/** SYSTEM Network offline/audit. Concrete extension seam; intentionally dependency-free. */
export const OFFLINE_AUDIT_MODULE='offline.audit' as const;
export type OfflineAuditContext={actorId:string;now:string};
export function isOfflineAuditContext(v:unknown):v is OfflineAuditContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
