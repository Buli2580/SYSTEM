export const MATCHMAKING_CREATE_USE_CASE='matchmaking.create' as const;
export type MatchmakingCreateInput={actorId:string;targetId?:string};
export type MatchmakingCreateResult={ok:true}|{ok:false;code:string};
export function validateMatchmakingCreate(input:MatchmakingCreateInput):MatchmakingCreateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
