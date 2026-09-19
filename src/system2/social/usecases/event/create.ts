export const EVENT_CREATE_USE_CASE='event.create' as const;
export type EventCreateInput={actorId:string;targetId?:string};
export type EventCreateResult={ok:true}|{ok:false;code:string};
export function validateEventCreate(input:EventCreateInput):EventCreateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
