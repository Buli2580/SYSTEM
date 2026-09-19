export const SPONSOR_UPDATE_USE_CASE='sponsor.update' as const;
export type SponsorUpdateInput={actorId:string;targetId?:string};
export type SponsorUpdateResult={ok:true}|{ok:false;code:string};
export function validateSponsorUpdate(input:SponsorUpdateInput):SponsorUpdateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
