export const RIVAL_REJECT_USE_CASE='rival.reject' as const;
export type RivalRejectInput={actorId:string;targetId?:string};
export type RivalRejectResult={ok:true}|{ok:false;code:string};
export function validateRivalReject(input:RivalRejectInput):RivalRejectResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
