export const MATCHMAKING_JOIN_USE_CASE='matchmaking.join' as const;
export type MatchmakingJoinInput={actorId:string;targetId?:string};
export type MatchmakingJoinResult={ok:true}|{ok:false;code:string};
export function validateMatchmakingJoin(input:MatchmakingJoinInput):MatchmakingJoinResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
