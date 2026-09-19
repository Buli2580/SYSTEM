export const SEASON_PUBLISH_USE_CASE='season.publish' as const;
export type SeasonPublishInput={actorId:string;targetId?:string};
export type SeasonPublishResult={ok:true}|{ok:false;code:string};
export function validateSeasonPublish(input:SeasonPublishInput):SeasonPublishResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
