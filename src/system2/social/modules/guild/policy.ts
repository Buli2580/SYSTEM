/** SYSTEM Network guild/policy. Concrete extension seam; intentionally dependency-free. */
export const GUILD_POLICY_MODULE='guild.policy' as const;
export type GuildPolicyContext={actorId:string;now:string};
export function isGuildPolicyContext(v:unknown):v is GuildPolicyContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
