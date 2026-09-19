/** SYSTEM Network rival/queries. Concrete extension seam; intentionally dependency-free. */
export const RIVAL_QUERIES_MODULE='rival.queries' as const;
export type RivalQueriesContext={actorId:string;now:string};
export function isRivalQueriesContext(v:unknown):v is RivalQueriesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
