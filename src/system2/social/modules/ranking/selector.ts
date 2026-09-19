/** SYSTEM Network ranking/selector. Concrete extension seam; intentionally dependency-free. */
export const RANKING_SELECTOR_MODULE='ranking.selector' as const;
export type RankingSelectorContext={actorId:string;now:string};
export function isRankingSelectorContext(v:unknown):v is RankingSelectorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
