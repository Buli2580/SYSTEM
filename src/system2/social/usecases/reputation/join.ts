export const REPUTATION_JOIN_USE_CASE='reputation.join' as const;
export type ReputationJoinInput={actorId:string;targetId?:string};
export type ReputationJoinResult={ok:true}|{ok:false;code:string};
export function validateReputationJoin(input:ReputationJoinInput):ReputationJoinResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
