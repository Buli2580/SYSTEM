/** SYSTEM Network reputation/queries. Concrete extension seam; intentionally dependency-free. */
export const REPUTATION_QUERIES_MODULE='reputation.queries' as const;
export type ReputationQueriesContext={actorId:string;now:string};
export function isReputationQueriesContext(v:unknown):v is ReputationQueriesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
