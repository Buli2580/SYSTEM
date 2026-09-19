/** SYSTEM Network guild/validator. Concrete extension seam; intentionally dependency-free. */
export const GUILD_VALIDATOR_MODULE='guild.validator' as const;
export type GuildValidatorContext={actorId:string;now:string};
export function isGuildValidatorContext(v:unknown):v is GuildValidatorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
