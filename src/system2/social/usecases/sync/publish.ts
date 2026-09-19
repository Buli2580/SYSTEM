export const SYNC_PUBLISH_USE_CASE='sync.publish' as const;
export type SyncPublishInput={actorId:string;targetId?:string};
export type SyncPublishResult={ok:true}|{ok:false;code:string};
export function validateSyncPublish(input:SyncPublishInput):SyncPublishResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
