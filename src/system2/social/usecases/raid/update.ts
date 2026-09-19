export const RAID_UPDATE_USE_CASE='raid.update' as const;
export type RaidUpdateInput={actorId:string;targetId?:string};
export type RaidUpdateResult={ok:true}|{ok:false;code:string};
export function validateRaidUpdate(input:RaidUpdateInput):RaidUpdateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
