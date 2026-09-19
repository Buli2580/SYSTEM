export const CHALLENGE_REMOVE_USE_CASE='challenge.remove' as const;
export type ChallengeRemoveInput={actorId:string;targetId?:string};
export type ChallengeRemoveResult={ok:true}|{ok:false;code:string};
export function validateChallengeRemove(input:ChallengeRemoveInput):ChallengeRemoveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
