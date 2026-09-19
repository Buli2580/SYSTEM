export const EVENT_REJECT_USE_CASE='event.reject' as const;
export type EventRejectInput={actorId:string;targetId?:string};
export type EventRejectResult={ok:true}|{ok:false;code:string};
export function validateEventReject(input:EventRejectInput):EventRejectResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
