/** SYSTEM Network moderation/audit. Concrete extension seam; intentionally dependency-free. */
export const MODERATION_AUDIT_MODULE='moderation.audit' as const;
export type ModerationAuditContext={actorId:string;now:string};
export function isModerationAuditContext(v:unknown):v is ModerationAuditContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
