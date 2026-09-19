export const RIVAL_UPDATE_USE_CASE='rival.update' as const;
export type RivalUpdateInput={actorId:string;targetId?:string};
export type RivalUpdateResult={ok:true}|{ok:false;code:string};
export function validateRivalUpdate(input:RivalUpdateInput):RivalUpdateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
