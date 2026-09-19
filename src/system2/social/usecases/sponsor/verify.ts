export const SPONSOR_VERIFY_USE_CASE='sponsor.verify' as const;
export type SponsorVerifyInput={actorId:string;targetId?:string};
export type SponsorVerifyResult={ok:true}|{ok:false;code:string};
export function validateSponsorVerify(input:SponsorVerifyInput):SponsorVerifyResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
