export const REPUTATION_CREATE_USE_CASE='reputation.create' as const;
export type ReputationCreateInput={actorId:string;targetId?:string};
export type ReputationCreateResult={ok:true}|{ok:false;code:string};
export function validateReputationCreate(input:ReputationCreateInput):ReputationCreateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
