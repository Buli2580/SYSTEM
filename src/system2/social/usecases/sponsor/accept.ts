export const SPONSOR_ACCEPT_USE_CASE='sponsor.accept' as const;
export type SponsorAcceptInput={actorId:string;targetId?:string};
export type SponsorAcceptResult={ok:true}|{ok:false;code:string};
export function validateSponsorAccept(input:SponsorAcceptInput):SponsorAcceptResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
