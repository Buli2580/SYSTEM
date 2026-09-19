export const DISCOVERY_REJECT_USE_CASE='discovery.reject' as const;
export type DiscoveryRejectInput={actorId:string;targetId?:string};
export type DiscoveryRejectResult={ok:true}|{ok:false;code:string};
export function validateDiscoveryReject(input:DiscoveryRejectInput):DiscoveryRejectResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
