export const REPUTATION_REMOVE_USE_CASE='reputation.remove' as const;
export type ReputationRemoveInput={actorId:string;targetId?:string};
export type ReputationRemoveResult={ok:true}|{ok:false;code:string};
export function validateReputationRemove(input:ReputationRemoveInput):ReputationRemoveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
