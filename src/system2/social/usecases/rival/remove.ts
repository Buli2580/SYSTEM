export const RIVAL_REMOVE_USE_CASE='rival.remove' as const;
export type RivalRemoveInput={actorId:string;targetId?:string};
export type RivalRemoveResult={ok:true}|{ok:false;code:string};
export function validateRivalRemove(input:RivalRemoveInput):RivalRemoveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
