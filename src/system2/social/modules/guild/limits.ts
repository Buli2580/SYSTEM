/** SYSTEM Network guild/limits. Concrete extension seam; intentionally dependency-free. */
export const GUILD_LIMITS_MODULE='guild.limits' as const;
export type GuildLimitsContext={actorId:string;now:string};
export function isGuildLimitsContext(v:unknown):v is GuildLimitsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
