/** SYSTEM Network season/queries. Concrete extension seam; intentionally dependency-free. */
export const SEASON_QUERIES_MODULE='season.queries' as const;
export type SeasonQueriesContext={actorId:string;now:string};
export function isSeasonQueriesContext(v:unknown):v is SeasonQueriesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
