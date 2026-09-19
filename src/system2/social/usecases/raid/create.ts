export const RAID_CREATE_USE_CASE='raid.create' as const;
export type RaidCreateInput={actorId:string;targetId?:string};
export type RaidCreateResult={ok:true}|{ok:false;code:string};
export function validateRaidCreate(input:RaidCreateInput):RaidCreateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
