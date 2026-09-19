export const PARTY_REMOVE_USE_CASE='party.remove' as const;
export type PartyRemoveInput={actorId:string;targetId?:string};
export type PartyRemoveResult={ok:true}|{ok:false;code:string};
export function validatePartyRemove(input:PartyRemoveInput):PartyRemoveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
