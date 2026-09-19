export const RAID_REMOVE_USE_CASE='raid.remove' as const;
export type RaidRemoveInput={actorId:string;targetId?:string};
export type RaidRemoveResult={ok:true}|{ok:false;code:string};
export function validateRaidRemove(input:RaidRemoveInput):RaidRemoveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
