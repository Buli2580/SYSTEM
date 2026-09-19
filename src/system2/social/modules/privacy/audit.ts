/** SYSTEM Network privacy/audit. Concrete extension seam; intentionally dependency-free. */
export const PRIVACY_AUDIT_MODULE='privacy.audit' as const;
export type PrivacyAuditContext={actorId:string;now:string};
export function isPrivacyAuditContext(v:unknown):v is PrivacyAuditContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
