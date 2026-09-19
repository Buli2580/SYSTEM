/** SYSTEM Network guild/state. Concrete extension seam; intentionally dependency-free. */
export const GUILD_STATE_MODULE='guild.state' as const;
export type GuildStateContext={actorId:string;now:string};
export function isGuildStateContext(v:unknown):v is GuildStateContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
