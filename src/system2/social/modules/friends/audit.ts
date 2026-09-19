/** SYSTEM Network friends/audit. Concrete extension seam; intentionally dependency-free. */
export const FRIENDS_AUDIT_MODULE='friends.audit' as const;
export type FriendsAuditContext={actorId:string;now:string};
export function isFriendsAuditContext(v:unknown):v is FriendsAuditContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
