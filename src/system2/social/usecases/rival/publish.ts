export const RIVAL_PUBLISH_USE_CASE='rival.publish' as const;
export type RivalPublishInput={actorId:string;targetId?:string};
export type RivalPublishResult={ok:true}|{ok:false;code:string};
export function validateRivalPublish(input:RivalPublishInput):RivalPublishResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
