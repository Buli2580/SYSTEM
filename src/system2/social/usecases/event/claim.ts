export const EVENT_CLAIM_USE_CASE='event.claim' as const;
export type EventClaimInput={actorId:string;targetId?:string};
export type EventClaimResult={ok:true}|{ok:false;code:string};
export function validateEventClaim(input:EventClaimInput):EventClaimResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
