/** SYSTEM Network season/reducer. Concrete extension seam; intentionally dependency-free. */
export const SEASON_REDUCER_MODULE='season.reducer' as const;
export type SeasonReducerContext={actorId:string;now:string};
export function isSeasonReducerContext(v:unknown):v is SeasonReducerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
