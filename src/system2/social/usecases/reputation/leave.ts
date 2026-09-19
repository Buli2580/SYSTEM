export const REPUTATION_LEAVE_USE_CASE='reputation.leave' as const;
export type ReputationLeaveInput={actorId:string;targetId?:string};
export type ReputationLeaveResult={ok:true}|{ok:false;code:string};
export function validateReputationLeave(input:ReputationLeaveInput):ReputationLeaveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
