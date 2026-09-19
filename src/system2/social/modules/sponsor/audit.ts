/** SYSTEM Network sponsor/audit. Concrete extension seam; intentionally dependency-free. */
export const SPONSOR_AUDIT_MODULE='sponsor.audit' as const;
export type SponsorAuditContext={actorId:string;now:string};
export function isSponsorAuditContext(v:unknown):v is SponsorAuditContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
