export const DISCOVERY_REMOVE_USE_CASE='discovery.remove' as const;
export type DiscoveryRemoveInput={actorId:string;targetId?:string};
export type DiscoveryRemoveResult={ok:true}|{ok:false;code:string};
export function validateDiscoveryRemove(input:DiscoveryRemoveInput):DiscoveryRemoveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
