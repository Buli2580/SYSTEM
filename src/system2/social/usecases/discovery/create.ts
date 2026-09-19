export const DISCOVERY_CREATE_USE_CASE='discovery.create' as const;
export type DiscoveryCreateInput={actorId:string;targetId?:string};
export type DiscoveryCreateResult={ok:true}|{ok:false;code:string};
export function validateDiscoveryCreate(input:DiscoveryCreateInput):DiscoveryCreateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
