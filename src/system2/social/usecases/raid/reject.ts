export const RAID_REJECT_USE_CASE='raid.reject' as const;
export type RaidRejectInput={actorId:string;targetId?:string};
export type RaidRejectResult={ok:true}|{ok:false;code:string};
export function validateRaidReject(input:RaidRejectInput):RaidRejectResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
