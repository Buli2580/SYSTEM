export const MATCHMAKING_REJECT_USE_CASE='matchmaking.reject' as const;
export type MatchmakingRejectInput={actorId:string;targetId?:string};
export type MatchmakingRejectResult={ok:true}|{ok:false;code:string};
export function validateMatchmakingReject(input:MatchmakingRejectInput):MatchmakingRejectResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
