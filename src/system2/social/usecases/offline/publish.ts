export const OFFLINE_PUBLISH_USE_CASE='offline.publish' as const;
export type OfflinePublishInput={actorId:string;targetId?:string};
export type OfflinePublishResult={ok:true}|{ok:false;code:string};
export function validateOfflinePublish(input:OfflinePublishInput):OfflinePublishResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
