/** SYSTEM Network guild/permissions. Concrete extension seam; intentionally dependency-free. */
export const GUILD_PERMISSIONS_MODULE='guild.permissions' as const;
export type GuildPermissionsContext={actorId:string;now:string};
export function isGuildPermissionsContext(v:unknown):v is GuildPermissionsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
