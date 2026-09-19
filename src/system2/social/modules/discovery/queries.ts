/** SYSTEM Network discovery/queries. Concrete extension seam; intentionally dependency-free. */
export const DISCOVERY_QUERIES_MODULE='discovery.queries' as const;
export type DiscoveryQueriesContext={actorId:string;now:string};
export function isDiscoveryQueriesContext(v:unknown):v is DiscoveryQueriesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
