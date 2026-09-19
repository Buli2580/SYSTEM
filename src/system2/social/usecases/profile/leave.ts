export const PROFILE_LEAVE_USE_CASE='profile.leave' as const;
export type ProfileLeaveInput={actorId:string;targetId?:string};
export type ProfileLeaveResult={ok:true}|{ok:false;code:string};
export function validateProfileLeave(input:ProfileLeaveInput):ProfileLeaveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
