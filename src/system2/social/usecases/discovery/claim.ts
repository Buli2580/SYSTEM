export const DISCOVERY_CLAIM_USE_CASE='discovery.claim' as const;
export type DiscoveryClaimInput={actorId:string;targetId?:string};
export type DiscoveryClaimResult={ok:true}|{ok:false;code:string};
export function validateDiscoveryClaim(input:DiscoveryClaimInput):DiscoveryClaimResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
