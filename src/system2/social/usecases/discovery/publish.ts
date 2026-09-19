export const DISCOVERY_PUBLISH_USE_CASE='discovery.publish' as const;
export type DiscoveryPublishInput={actorId:string;targetId?:string};
export type DiscoveryPublishResult={ok:true}|{ok:false;code:string};
export function validateDiscoveryPublish(input:DiscoveryPublishInput):DiscoveryPublishResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
