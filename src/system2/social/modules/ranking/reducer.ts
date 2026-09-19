/** SYSTEM Network ranking/reducer. Concrete extension seam; intentionally dependency-free. */
export const RANKING_REDUCER_MODULE='ranking.reducer' as const;
export type RankingReducerContext={actorId:string;now:string};
export function isRankingReducerContext(v:unknown):v is RankingReducerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
