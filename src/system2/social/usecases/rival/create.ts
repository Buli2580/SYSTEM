export const RIVAL_CREATE_USE_CASE='rival.create' as const;
export type RivalCreateInput={actorId:string;targetId?:string};
export type RivalCreateResult={ok:true}|{ok:false;code:string};
export function validateRivalCreate(input:RivalCreateInput):RivalCreateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
