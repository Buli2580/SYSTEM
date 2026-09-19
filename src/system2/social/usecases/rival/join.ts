export const RIVAL_JOIN_USE_CASE='rival.join' as const;
export type RivalJoinInput={actorId:string;targetId?:string};
export type RivalJoinResult={ok:true}|{ok:false;code:string};
export function validateRivalJoin(input:RivalJoinInput):RivalJoinResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
