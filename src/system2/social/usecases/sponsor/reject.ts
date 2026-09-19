export const SPONSOR_REJECT_USE_CASE='sponsor.reject' as const;
export type SponsorRejectInput={actorId:string;targetId?:string};
export type SponsorRejectResult={ok:true}|{ok:false;code:string};
export function validateSponsorReject(input:SponsorRejectInput):SponsorRejectResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
