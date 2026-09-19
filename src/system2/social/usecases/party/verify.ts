export const PARTY_VERIFY_USE_CASE='party.verify' as const;
export type PartyVerifyInput={actorId:string;targetId?:string};
export type PartyVerifyResult={ok:true}|{ok:false;code:string};
export function validatePartyVerify(input:PartyVerifyInput):PartyVerifyResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
