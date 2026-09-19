export const DISCOVERY_LEAVE_USE_CASE='discovery.leave' as const;
export type DiscoveryLeaveInput={actorId:string;targetId?:string};
export type DiscoveryLeaveResult={ok:true}|{ok:false;code:string};
export function validateDiscoveryLeave(input:DiscoveryLeaveInput):DiscoveryLeaveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
