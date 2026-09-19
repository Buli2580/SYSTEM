export const RIVAL_LEAVE_USE_CASE='rival.leave' as const;
export type RivalLeaveInput={actorId:string;targetId?:string};
export type RivalLeaveResult={ok:true}|{ok:false;code:string};
export function validateRivalLeave(input:RivalLeaveInput):RivalLeaveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
