/** SYSTEM Network ranking/policy. Concrete extension seam; intentionally dependency-free. */
export const RANKING_POLICY_MODULE='ranking.policy' as const;
export type RankingPolicyContext={actorId:string;now:string};
export function isRankingPolicyContext(v:unknown):v is RankingPolicyContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
