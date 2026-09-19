/** SYSTEM Network guild/eligibility. Concrete extension seam; intentionally dependency-free. */
export const GUILD_ELIGIBILITY_MODULE='guild.eligibility' as const;
export type GuildEligibilityContext={actorId:string;now:string};
export function isGuildEligibilityContext(v:unknown):v is GuildEligibilityContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
