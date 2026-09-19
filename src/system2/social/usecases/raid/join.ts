export const RAID_JOIN_USE_CASE='raid.join' as const;
export type RaidJoinInput={actorId:string;targetId?:string};
export type RaidJoinResult={ok:true}|{ok:false;code:string};
export function validateRaidJoin(input:RaidJoinInput):RaidJoinResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
