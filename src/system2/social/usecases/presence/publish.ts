export const PRESENCE_PUBLISH_USE_CASE='presence.publish' as const;
export type PresencePublishInput={actorId:string;targetId?:string};
export type PresencePublishResult={ok:true}|{ok:false;code:string};
export function validatePresencePublish(input:PresencePublishInput):PresencePublishResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
