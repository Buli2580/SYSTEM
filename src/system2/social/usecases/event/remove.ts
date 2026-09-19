export const EVENT_REMOVE_USE_CASE='event.remove' as const;
export type EventRemoveInput={actorId:string;targetId?:string};
export type EventRemoveResult={ok:true}|{ok:false;code:string};
export function validateEventRemove(input:EventRemoveInput):EventRemoveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
