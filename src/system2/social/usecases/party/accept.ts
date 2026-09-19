export const PARTY_ACCEPT_USE_CASE='party.accept' as const;
export type PartyAcceptInput={actorId:string;targetId?:string};
export type PartyAcceptResult={ok:true}|{ok:false;code:string};
export function validatePartyAccept(input:PartyAcceptInput):PartyAcceptResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
