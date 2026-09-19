export const DISCOVERY_UPDATE_USE_CASE='discovery.update' as const;
export type DiscoveryUpdateInput={actorId:string;targetId?:string};
export type DiscoveryUpdateResult={ok:true}|{ok:false;code:string};
export function validateDiscoveryUpdate(input:DiscoveryUpdateInput):DiscoveryUpdateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
