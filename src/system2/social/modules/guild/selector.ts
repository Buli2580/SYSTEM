/** SYSTEM Network guild/selector. Concrete extension seam; intentionally dependency-free. */
export const GUILD_SELECTOR_MODULE='guild.selector' as const;
export type GuildSelectorContext={actorId:string;now:string};
export function isGuildSelectorContext(v:unknown):v is GuildSelectorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
