export const RAID_LEAVE_USE_CASE='raid.leave' as const;
export type RaidLeaveInput={actorId:string;targetId?:string};
export type RaidLeaveResult={ok:true}|{ok:false;code:string};
export function validateRaidLeave(input:RaidLeaveInput):RaidLeaveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
