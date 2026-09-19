export const RIVAL_ACCEPT_USE_CASE='rival.accept' as const;
export type RivalAcceptInput={actorId:string;targetId?:string};
export type RivalAcceptResult={ok:true}|{ok:false;code:string};
export function validateRivalAccept(input:RivalAcceptInput):RivalAcceptResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
