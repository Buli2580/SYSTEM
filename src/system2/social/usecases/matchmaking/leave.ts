export const MATCHMAKING_LEAVE_USE_CASE='matchmaking.leave' as const;
export type MatchmakingLeaveInput={actorId:string;targetId?:string};
export type MatchmakingLeaveResult={ok:true}|{ok:false;code:string};
export function validateMatchmakingLeave(input:MatchmakingLeaveInput):MatchmakingLeaveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
