export const CHALLENGE_CLAIM_USE_CASE='challenge.claim' as const;
export type ChallengeClaimInput={actorId:string;targetId?:string};
export type ChallengeClaimResult={ok:true}|{ok:false;code:string};
export function validateChallengeClaim(input:ChallengeClaimInput):ChallengeClaimResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
