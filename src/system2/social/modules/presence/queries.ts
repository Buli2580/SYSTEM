/** SYSTEM Network presence/queries. Concrete extension seam; intentionally dependency-free. */
export const PRESENCE_QUERIES_MODULE='presence.queries' as const;
export type PresenceQueriesContext={actorId:string;now:string};
export function isPresenceQueriesContext(v:unknown):v is PresenceQueriesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
