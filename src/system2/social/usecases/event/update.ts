export const EVENT_UPDATE_USE_CASE='event.update' as const;
export type EventUpdateInput={actorId:string;targetId?:string};
export type EventUpdateResult={ok:true}|{ok:false;code:string};
export function validateEventUpdate(input:EventUpdateInput):EventUpdateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
