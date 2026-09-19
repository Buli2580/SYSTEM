/** SYSTEM Network guild/repository. Concrete extension seam; intentionally dependency-free. */
export const GUILD_REPOSITORY_MODULE='guild.repository' as const;
export type GuildRepositoryContext={actorId:string;now:string};
export function isGuildRepositoryContext(v:unknown):v is GuildRepositoryContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
