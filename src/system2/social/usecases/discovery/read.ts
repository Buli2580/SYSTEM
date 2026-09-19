export const DISCOVERY_READ_USE_CASE='discovery.read' as const;
export type DiscoveryReadInput={actorId:string;targetId?:string};
export type DiscoveryReadResult={ok:true}|{ok:false;code:string};
export function validateDiscoveryRead(input:DiscoveryReadInput):DiscoveryReadResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
