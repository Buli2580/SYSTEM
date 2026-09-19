/** SYSTEM Network presence/audit. Concrete extension seam; intentionally dependency-free. */
export const PRESENCE_AUDIT_MODULE='presence.audit' as const;
export type PresenceAuditContext={actorId:string;now:string};
export function isPresenceAuditContext(v:unknown):v is PresenceAuditContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
