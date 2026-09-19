export const CHALLENGE_VERIFY_USE_CASE='challenge.verify' as const;
export type ChallengeVerifyInput={actorId:string;targetId?:string};
export type ChallengeVerifyResult={ok:true}|{ok:false;code:string};
export function validateChallengeVerify(input:ChallengeVerifyInput):ChallengeVerifyResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
