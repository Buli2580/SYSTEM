/** SYSTEM Network ranking/audit. Concrete extension seam; intentionally dependency-free. */
export const RANKING_AUDIT_MODULE='ranking.audit' as const;
export type RankingAuditContext={actorId:string;now:string};
export function isRankingAuditContext(v:unknown):v is RankingAuditContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
