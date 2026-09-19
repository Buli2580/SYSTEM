/** SYSTEM Network offline/queries. Concrete extension seam; intentionally dependency-free. */
export const OFFLINE_QUERIES_MODULE='offline.queries' as const;
export type OfflineQueriesContext={actorId:string;now:string};
export function isOfflineQueriesContext(v:unknown):v is OfflineQueriesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
