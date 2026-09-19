export const PARTY_CREATE_USE_CASE='party.create' as const;
export type PartyCreateInput={actorId:string;targetId?:string};
export type PartyCreateResult={ok:true}|{ok:false;code:string};
export function validatePartyCreate(input:PartyCreateInput):PartyCreateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
