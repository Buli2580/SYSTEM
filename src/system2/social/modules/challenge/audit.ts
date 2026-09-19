/** SYSTEM Network challenge/audit. Concrete extension seam; intentionally dependency-free. */
export const CHALLENGE_AUDIT_MODULE='challenge.audit' as const;
export type ChallengeAuditContext={actorId:string;now:string};
export function isChallengeAuditContext(v:unknown):v is ChallengeAuditContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
