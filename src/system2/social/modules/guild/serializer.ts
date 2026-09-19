/** SYSTEM Network guild/serializer. Concrete extension seam; intentionally dependency-free. */
export const GUILD_SERIALIZER_MODULE='guild.serializer' as const;
export type GuildSerializerContext={actorId:string;now:string};
export function isGuildSerializerContext(v:unknown):v is GuildSerializerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
