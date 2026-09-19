/** SYSTEM Network security/audit. Concrete extension seam; intentionally dependency-free. */
export const SECURITY_AUDIT_MODULE='security.audit' as const;
export type SecurityAuditContext={actorId:string;now:string};
export function isSecurityAuditContext(v:unknown):v is SecurityAuditContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
