export const DISCOVERY_ACCEPT_USE_CASE='discovery.accept' as const;
export type DiscoveryAcceptInput={actorId:string;targetId?:string};
export type DiscoveryAcceptResult={ok:true}|{ok:false;code:string};
export function validateDiscoveryAccept(input:DiscoveryAcceptInput):DiscoveryAcceptResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
