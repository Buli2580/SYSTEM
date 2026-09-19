export const EVENT_JOIN_USE_CASE='event.join' as const;
export type EventJoinInput={actorId:string;targetId?:string};
export type EventJoinResult={ok:true}|{ok:false;code:string};
export function validateEventJoin(input:EventJoinInput):EventJoinResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
