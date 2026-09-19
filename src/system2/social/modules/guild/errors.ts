/** SYSTEM Network guild/errors. Concrete extension seam; intentionally dependency-free. */
export const GUILD_ERRORS_MODULE='guild.errors' as const;
export type GuildErrorsContext={actorId:string;now:string};
export function isGuildErrorsContext(v:unknown):v is GuildErrorsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
