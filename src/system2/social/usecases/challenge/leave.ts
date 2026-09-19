export const CHALLENGE_LEAVE_USE_CASE='challenge.leave' as const;
export type ChallengeLeaveInput={actorId:string;targetId?:string};
export type ChallengeLeaveResult={ok:true}|{ok:false;code:string};
export function validateChallengeLeave(input:ChallengeLeaveInput):ChallengeLeaveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
