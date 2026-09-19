/** SYSTEM Network guild/reducer. Concrete extension seam; intentionally dependency-free. */
export const GUILD_REDUCER_MODULE='guild.reducer' as const;
export type GuildReducerContext={actorId:string;now:string};
export function isGuildReducerContext(v:unknown):v is GuildReducerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
