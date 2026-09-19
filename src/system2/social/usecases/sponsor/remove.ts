export const SPONSOR_REMOVE_USE_CASE='sponsor.remove' as const;
export type SponsorRemoveInput={actorId:string;targetId?:string};
export type SponsorRemoveResult={ok:true}|{ok:false;code:string};
export function validateSponsorRemove(input:SponsorRemoveInput):SponsorRemoveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
