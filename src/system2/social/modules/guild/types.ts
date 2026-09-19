/** SYSTEM Network guild/types. Concrete extension seam; intentionally dependency-free. */
export const GUILD_TYPES_MODULE='guild.types' as const;
export type GuildTypesContext={actorId:string;now:string};
export function isGuildTypesContext(v:unknown):v is GuildTypesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
