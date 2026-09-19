export const EVENT_READ_USE_CASE='event.read' as const;
export type EventReadInput={actorId:string;targetId?:string};
export type EventReadResult={ok:true}|{ok:false;code:string};
export function validateEventRead(input:EventReadInput):EventReadResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
