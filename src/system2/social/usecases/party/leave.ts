export const PARTY_LEAVE_USE_CASE='party.leave' as const;
export type PartyLeaveInput={actorId:string;targetId?:string};
export type PartyLeaveResult={ok:true}|{ok:false;code:string};
export function validatePartyLeave(input:PartyLeaveInput):PartyLeaveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
