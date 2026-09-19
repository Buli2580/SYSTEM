export const PRESENCE_CLAIM_USE_CASE='presence.claim' as const;
export type PresenceClaimInput={actorId:string;targetId?:string};
export type PresenceClaimResult={ok:true}|{ok:false;code:string};
export function validatePresenceClaim(input:PresenceClaimInput):PresenceClaimResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
