export const REPUTATION_UPDATE_USE_CASE='reputation.update' as const;
export type ReputationUpdateInput={actorId:string;targetId?:string};
export type ReputationUpdateResult={ok:true}|{ok:false;code:string};
export function validateReputationUpdate(input:ReputationUpdateInput):ReputationUpdateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
