export const SPONSOR_READ_USE_CASE='sponsor.read' as const;
export type SponsorReadInput={actorId:string;targetId?:string};
export type SponsorReadResult={ok:true}|{ok:false;code:string};
export function validateSponsorRead(input:SponsorReadInput):SponsorReadResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
