/** SYSTEM Network rival/audit. Concrete extension seam; intentionally dependency-free. */
export const RIVAL_AUDIT_MODULE='rival.audit' as const;
export type RivalAuditContext={actorId:string;now:string};
export function isRivalAuditContext(v:unknown):v is RivalAuditContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
