export const RIVAL_VERIFY_USE_CASE='rival.verify' as const;
export type RivalVerifyInput={actorId:string;targetId?:string};
export type RivalVerifyResult={ok:true}|{ok:false;code:string};
export function validateRivalVerify(input:RivalVerifyInput):RivalVerifyResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
