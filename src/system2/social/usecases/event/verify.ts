export const EVENT_VERIFY_USE_CASE='event.verify' as const;
export type EventVerifyInput={actorId:string;targetId?:string};
export type EventVerifyResult={ok:true}|{ok:false;code:string};
export function validateEventVerify(input:EventVerifyInput):EventVerifyResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
