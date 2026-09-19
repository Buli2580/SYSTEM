export const CHALLENGE_REJECT_USE_CASE='challenge.reject' as const;
export type ChallengeRejectInput={actorId:string;targetId?:string};
export type ChallengeRejectResult={ok:true}|{ok:false;code:string};
export function validateChallengeReject(input:ChallengeRejectInput):ChallengeRejectResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
