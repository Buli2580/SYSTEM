/** SYSTEM Network guild/commands. Concrete extension seam; intentionally dependency-free. */
export const GUILD_COMMANDS_MODULE='guild.commands' as const;
export type GuildCommandsContext={actorId:string;now:string};
export function isGuildCommandsContext(v:unknown):v is GuildCommandsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
