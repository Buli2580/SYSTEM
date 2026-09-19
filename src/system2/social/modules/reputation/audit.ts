/** SYSTEM Network reputation/audit. Concrete extension seam; intentionally dependency-free. */
export const REPUTATION_AUDIT_MODULE='reputation.audit' as const;
export type ReputationAuditContext={actorId:string;now:string};
export function isReputationAuditContext(v:unknown):v is ReputationAuditContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
