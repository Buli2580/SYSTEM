export const CHALLENGE_PUBLISH_USE_CASE='challenge.publish' as const;
export type ChallengePublishInput={actorId:string;targetId?:string};
export type ChallengePublishResult={ok:true}|{ok:false;code:string};
export function validateChallengePublish(input:ChallengePublishInput):ChallengePublishResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
