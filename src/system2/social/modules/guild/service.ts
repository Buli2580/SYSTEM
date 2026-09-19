/** SYSTEM Network guild/service. Concrete extension seam; intentionally dependency-free. */
export const GUILD_SERVICE_MODULE='guild.service' as const;
export type GuildServiceContext={actorId:string;now:string};
export function isGuildServiceContext(v:unknown):v is GuildServiceContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
