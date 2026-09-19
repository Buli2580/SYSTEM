export const REPUTATION_REJECT_USE_CASE='reputation.reject' as const;
export type ReputationRejectInput={actorId:string;targetId?:string};
export type ReputationRejectResult={ok:true}|{ok:false;code:string};
export function validateReputationReject(input:ReputationRejectInput):ReputationRejectResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
