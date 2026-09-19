export const MATCHMAKING_ACCEPT_USE_CASE='matchmaking.accept' as const;
export type MatchmakingAcceptInput={actorId:string;targetId?:string};
export type MatchmakingAcceptResult={ok:true}|{ok:false;code:string};
export function validateMatchmakingAccept(input:MatchmakingAcceptInput):MatchmakingAcceptResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
