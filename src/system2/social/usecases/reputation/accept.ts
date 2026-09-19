export const REPUTATION_ACCEPT_USE_CASE='reputation.accept' as const;
export type ReputationAcceptInput={actorId:string;targetId?:string};
export type ReputationAcceptResult={ok:true}|{ok:false;code:string};
export function validateReputationAccept(input:ReputationAcceptInput):ReputationAcceptResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
