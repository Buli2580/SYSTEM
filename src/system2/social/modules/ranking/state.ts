/** SYSTEM Network ranking/state. Concrete extension seam; intentionally dependency-free. */
export const RANKING_STATE_MODULE='ranking.state' as const;
export type RankingStateContext={actorId:string;now:string};
export function isRankingStateContext(v:unknown):v is RankingStateContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
