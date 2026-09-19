/** SYSTEM Network referral/audit. Concrete extension seam; intentionally dependency-free. */
export const REFERRAL_AUDIT_MODULE='referral.audit' as const;
export type ReferralAuditContext={actorId:string;now:string};
export function isReferralAuditContext(v:unknown):v is ReferralAuditContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
