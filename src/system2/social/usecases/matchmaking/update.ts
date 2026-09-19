export const MATCHMAKING_UPDATE_USE_CASE='matchmaking.update' as const;
export type MatchmakingUpdateInput={actorId:string;targetId?:string};
export type MatchmakingUpdateResult={ok:true}|{ok:false;code:string};
export function validateMatchmakingUpdate(input:MatchmakingUpdateInput):MatchmakingUpdateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
