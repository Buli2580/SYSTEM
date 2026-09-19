export const MATCHMAKING_PUBLISH_USE_CASE='matchmaking.publish' as const;
export type MatchmakingPublishInput={actorId:string;targetId?:string};
export type MatchmakingPublishResult={ok:true}|{ok:false;code:string};
export function validateMatchmakingPublish(input:MatchmakingPublishInput):MatchmakingPublishResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
