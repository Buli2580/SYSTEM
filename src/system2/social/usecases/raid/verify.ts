export const RAID_VERIFY_USE_CASE='raid.verify' as const;
export type RaidVerifyInput={actorId:string;targetId?:string};
export type RaidVerifyResult={ok:true}|{ok:false;code:string};
export function validateRaidVerify(input:RaidVerifyInput):RaidVerifyResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
