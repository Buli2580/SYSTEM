export const CHALLENGE_ARCHIVE_USE_CASE='challenge.archive' as const;
export type ChallengeArchiveInput={actorId:string;targetId?:string};
export type ChallengeArchiveResult={ok:true}|{ok:false;code:string};
export function validateChallengeArchive(input:ChallengeArchiveInput):ChallengeArchiveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
