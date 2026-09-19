/** SYSTEM Network raid/audit. Concrete extension seam; intentionally dependency-free. */
export const RAID_AUDIT_MODULE='raid.audit' as const;
export type RaidAuditContext={actorId:string;now:string};
export function isRaidAuditContext(v:unknown):v is RaidAuditContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
