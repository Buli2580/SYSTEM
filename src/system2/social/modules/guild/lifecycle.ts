/** SYSTEM Network guild/lifecycle. Concrete extension seam; intentionally dependency-free. */
export const GUILD_LIFECYCLE_MODULE='guild.lifecycle' as const;
export type GuildLifecycleContext={actorId:string;now:string};
export function isGuildLifecycleContext(v:unknown):v is GuildLifecycleContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
