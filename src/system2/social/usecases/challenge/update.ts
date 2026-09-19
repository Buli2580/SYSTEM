export const CHALLENGE_UPDATE_USE_CASE='challenge.update' as const;
export type ChallengeUpdateInput={actorId:string;targetId?:string};
export type ChallengeUpdateResult={ok:true}|{ok:false;code:string};
export function validateChallengeUpdate(input:ChallengeUpdateInput):ChallengeUpdateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
