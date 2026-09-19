/** SYSTEM Network badge/audit. Concrete extension seam; intentionally dependency-free. */
export const BADGE_AUDIT_MODULE='badge.audit' as const;
export type BadgeAuditContext={actorId:string;now:string};
export function isBadgeAuditContext(v:unknown):v is BadgeAuditContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
