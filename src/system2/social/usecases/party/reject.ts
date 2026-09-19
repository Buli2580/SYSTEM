export const PARTY_REJECT_USE_CASE='party.reject' as const;
export type PartyRejectInput={actorId:string;targetId?:string};
export type PartyRejectResult={ok:true}|{ok:false;code:string};
export function validatePartyReject(input:PartyRejectInput):PartyRejectResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
