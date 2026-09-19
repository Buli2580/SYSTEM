export const REPUTATION_VERIFY_USE_CASE='reputation.verify' as const;
export type ReputationVerifyInput={actorId:string;targetId?:string};
export type ReputationVerifyResult={ok:true}|{ok:false;code:string};
export function validateReputationVerify(input:ReputationVerifyInput):ReputationVerifyResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
