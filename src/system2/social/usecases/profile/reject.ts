export const PROFILE_REJECT_USE_CASE='profile.reject' as const;
export type ProfileRejectInput={actorId:string;targetId?:string};
export type ProfileRejectResult={ok:true}|{ok:false;code:string};
export function validateProfileReject(input:ProfileRejectInput):ProfileRejectResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
