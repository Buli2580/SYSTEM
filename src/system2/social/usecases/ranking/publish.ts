export const RANKING_PUBLISH_USE_CASE='ranking.publish' as const;
export type RankingPublishInput={actorId:string;targetId?:string};
export type RankingPublishResult={ok:true}|{ok:false;code:string};
export function validateRankingPublish(input:RankingPublishInput):RankingPublishResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
