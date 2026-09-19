/** SYSTEM Network profile/audit. Concrete extension seam; intentionally dependency-free. */
export const PROFILE_AUDIT_MODULE='profile.audit' as const;
export type ProfileAuditContext={actorId:string;now:string};
export function isProfileAuditContext(v:unknown):v is ProfileAuditContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
