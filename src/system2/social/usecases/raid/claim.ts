export const RAID_CLAIM_USE_CASE='raid.claim' as const;
export type RaidClaimInput={actorId:string;targetId?:string};
export type RaidClaimResult={ok:true}|{ok:false;code:string};
export function validateRaidClaim(input:RaidClaimInput):RaidClaimResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
