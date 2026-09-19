export const CHALLENGE_ACCEPT_USE_CASE='challenge.accept' as const;
export type ChallengeAcceptInput={actorId:string;targetId?:string};
export type ChallengeAcceptResult={ok:true}|{ok:false;code:string};
export function validateChallengeAccept(input:ChallengeAcceptInput):ChallengeAcceptResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
