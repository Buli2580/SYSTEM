export const MATCHMAKING_REMOVE_USE_CASE='matchmaking.remove' as const;
export type MatchmakingRemoveInput={actorId:string;targetId?:string};
export type MatchmakingRemoveResult={ok:true}|{ok:false;code:string};
export function validateMatchmakingRemove(input:MatchmakingRemoveInput):MatchmakingRemoveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
