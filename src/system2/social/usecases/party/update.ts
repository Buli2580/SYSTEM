export const PARTY_UPDATE_USE_CASE='party.update' as const;
export type PartyUpdateInput={actorId:string;targetId?:string};
export type PartyUpdateResult={ok:true}|{ok:false;code:string};
export function validatePartyUpdate(input:PartyUpdateInput):PartyUpdateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
