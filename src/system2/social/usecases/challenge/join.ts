export const CHALLENGE_JOIN_USE_CASE='challenge.join' as const;
export type ChallengeJoinInput={actorId:string;targetId?:string};
export type ChallengeJoinResult={ok:true}|{ok:false;code:string};
export function validateChallengeJoin(input:ChallengeJoinInput):ChallengeJoinResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
