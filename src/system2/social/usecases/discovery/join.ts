export const DISCOVERY_JOIN_USE_CASE='discovery.join' as const;
export type DiscoveryJoinInput={actorId:string;targetId?:string};
export type DiscoveryJoinResult={ok:true}|{ok:false;code:string};
export function validateDiscoveryJoin(input:DiscoveryJoinInput):DiscoveryJoinResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
