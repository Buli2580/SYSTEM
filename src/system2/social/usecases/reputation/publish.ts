export const REPUTATION_PUBLISH_USE_CASE='reputation.publish' as const;
export type ReputationPublishInput={actorId:string;targetId?:string};
export type ReputationPublishResult={ok:true}|{ok:false;code:string};
export function validateReputationPublish(input:ReputationPublishInput):ReputationPublishResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
