export const SPONSOR_JOIN_USE_CASE='sponsor.join' as const;
export type SponsorJoinInput={actorId:string;targetId?:string};
export type SponsorJoinResult={ok:true}|{ok:false;code:string};
export function validateSponsorJoin(input:SponsorJoinInput):SponsorJoinResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
