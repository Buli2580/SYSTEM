/** SYSTEM Network sponsor/queries. Concrete extension seam; intentionally dependency-free. */
export const SPONSOR_QUERIES_MODULE='sponsor.queries' as const;
export type SponsorQueriesContext={actorId:string;now:string};
export function isSponsorQueriesContext(v:unknown):v is SponsorQueriesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
