/** SYSTEM Network guild/queries. Concrete extension seam; intentionally dependency-free. */
export const GUILD_QUERIES_MODULE='guild.queries' as const;
export type GuildQueriesContext={actorId:string;now:string};
export function isGuildQueriesContext(v:unknown):v is GuildQueriesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
