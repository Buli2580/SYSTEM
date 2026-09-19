/** SYSTEM Network guild/mapper. Concrete extension seam; intentionally dependency-free. */
export const GUILD_MAPPER_MODULE='guild.mapper' as const;
export type GuildMapperContext={actorId:string;now:string};
export function isGuildMapperContext(v:unknown):v is GuildMapperContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
