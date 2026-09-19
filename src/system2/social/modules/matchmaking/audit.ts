/** SYSTEM Network matchmaking/audit. Concrete extension seam; intentionally dependency-free. */
export const MATCHMAKING_AUDIT_MODULE='matchmaking.audit' as const;
export type MatchmakingAuditContext={actorId:string;now:string};
export function isMatchmakingAuditContext(v:unknown):v is MatchmakingAuditContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
