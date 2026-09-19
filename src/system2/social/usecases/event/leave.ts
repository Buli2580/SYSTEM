export const EVENT_LEAVE_USE_CASE='event.leave' as const;
export type EventLeaveInput={actorId:string;targetId?:string};
export type EventLeaveResult={ok:true}|{ok:false;code:string};
export function validateEventLeave(input:EventLeaveInput):EventLeaveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
