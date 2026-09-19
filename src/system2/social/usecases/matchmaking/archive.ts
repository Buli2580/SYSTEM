export const MATCHMAKING_ARCHIVE_USE_CASE='matchmaking.archive' as const;
export type MatchmakingArchiveInput={actorId:string;targetId?:string};
export type MatchmakingArchiveResult={ok:true}|{ok:false;code:string};
export function validateMatchmakingArchive(input:MatchmakingArchiveInput):MatchmakingArchiveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
