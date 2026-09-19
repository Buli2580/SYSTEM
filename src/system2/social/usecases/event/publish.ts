export const EVENT_PUBLISH_USE_CASE='event.publish' as const;
export type EventPublishInput={actorId:string;targetId?:string};
export type EventPublishResult={ok:true}|{ok:false;code:string};
export function validateEventPublish(input:EventPublishInput):EventPublishResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
