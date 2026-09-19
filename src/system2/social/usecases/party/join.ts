export const PARTY_JOIN_USE_CASE='party.join' as const;
export type PartyJoinInput={actorId:string;targetId?:string};
export type PartyJoinResult={ok:true}|{ok:false;code:string};
export function validatePartyJoin(input:PartyJoinInput):PartyJoinResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
