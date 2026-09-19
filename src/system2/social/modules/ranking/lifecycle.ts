/** SYSTEM Network ranking/lifecycle. Concrete extension seam; intentionally dependency-free. */
export const RANKING_LIFECYCLE_MODULE='ranking.lifecycle' as const;
export type RankingLifecycleContext={actorId:string;now:string};
export function isRankingLifecycleContext(v:unknown):v is RankingLifecycleContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
