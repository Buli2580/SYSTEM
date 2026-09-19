export const MATCHMAKING_VERIFY_USE_CASE='matchmaking.verify' as const;
export type MatchmakingVerifyInput={actorId:string;targetId?:string};
export type MatchmakingVerifyResult={ok:true}|{ok:false;code:string};
export function validateMatchmakingVerify(input:MatchmakingVerifyInput):MatchmakingVerifyResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
