export const CHALLENGE_READ_USE_CASE='challenge.read' as const;
export type ChallengeReadInput={actorId:string;targetId?:string};
export type ChallengeReadResult={ok:true}|{ok:false;code:string};
export function validateChallengeRead(input:ChallengeReadInput):ChallengeReadResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
