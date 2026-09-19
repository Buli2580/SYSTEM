export const EVENT_ACCEPT_USE_CASE='event.accept' as const;
export type EventAcceptInput={actorId:string;targetId?:string};
export type EventAcceptResult={ok:true}|{ok:false;code:string};
export function validateEventAccept(input:EventAcceptInput):EventAcceptResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
