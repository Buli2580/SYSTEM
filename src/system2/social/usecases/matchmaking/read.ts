export const MATCHMAKING_READ_USE_CASE='matchmaking.read' as const;
export type MatchmakingReadInput={actorId:string;targetId?:string};
export type MatchmakingReadResult={ok:true}|{ok:false;code:string};
export function validateMatchmakingRead(input:MatchmakingReadInput):MatchmakingReadResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
