export const DISCOVERY_VERIFY_USE_CASE='discovery.verify' as const;
export type DiscoveryVerifyInput={actorId:string;targetId?:string};
export type DiscoveryVerifyResult={ok:true}|{ok:false;code:string};
export function validateDiscoveryVerify(input:DiscoveryVerifyInput):DiscoveryVerifyResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
