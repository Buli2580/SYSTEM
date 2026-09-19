export const SPONSOR_CREATE_USE_CASE='sponsor.create' as const;
export type SponsorCreateInput={actorId:string;targetId?:string};
export type SponsorCreateResult={ok:true}|{ok:false;code:string};
export function validateSponsorCreate(input:SponsorCreateInput):SponsorCreateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
