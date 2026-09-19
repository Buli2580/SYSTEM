export const GUILD_CLAIM_USE_CASE='guild.claim' as const;
export type GuildClaimInput={actorId:string;targetId?:string};
export type GuildClaimResult={ok:true}|{ok:false;code:string};
export function validateGuildClaim(input:GuildClaimInput):GuildClaimResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
