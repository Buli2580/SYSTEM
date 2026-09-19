/** SYSTEM Network raid/queries. Concrete extension seam; intentionally dependency-free. */
export const RAID_QUERIES_MODULE='raid.queries' as const;
export type RaidQueriesContext={actorId:string;now:string};
export function isRaidQueriesContext(v:unknown):v is RaidQueriesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
