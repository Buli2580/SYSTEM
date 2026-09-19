/** SYSTEM Network sync/queries. Concrete extension seam; intentionally dependency-free. */
export const SYNC_QUERIES_MODULE='sync.queries' as const;
export type SyncQueriesContext={actorId:string;now:string};
export function isSyncQueriesContext(v:unknown):v is SyncQueriesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
