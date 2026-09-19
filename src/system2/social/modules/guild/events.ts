/** SYSTEM Network guild/events. Concrete extension seam; intentionally dependency-free. */
export const GUILD_EVENTS_MODULE='guild.events' as const;
export type GuildEventsContext={actorId:string;now:string};
export function isGuildEventsContext(v:unknown):v is GuildEventsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
