export const PARTY_READ_USE_CASE='party.read' as const;
export type PartyReadInput={actorId:string;targetId?:string};
export type PartyReadResult={ok:true}|{ok:false;code:string};
export function validatePartyRead(input:PartyReadInput):PartyReadResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
