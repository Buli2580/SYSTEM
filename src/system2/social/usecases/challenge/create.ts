export const CHALLENGE_CREATE_USE_CASE='challenge.create' as const;
export type ChallengeCreateInput={actorId:string;targetId?:string};
export type ChallengeCreateResult={ok:true}|{ok:false;code:string};
export function validateChallengeCreate(input:ChallengeCreateInput):ChallengeCreateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
