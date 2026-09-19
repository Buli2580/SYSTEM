/** SYSTEM Network guild/audit. Concrete extension seam; intentionally dependency-free. */
export const GUILD_AUDIT_MODULE='guild.audit' as const;
export type GuildAuditContext={actorId:string;now:string};
export function isGuildAuditContext(v:unknown):v is GuildAuditContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
