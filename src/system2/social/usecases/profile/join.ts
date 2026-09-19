export const PROFILE_JOIN_USE_CASE='profile.join' as const;
export type ProfileJoinInput={actorId:string;targetId?:string};
export type ProfileJoinResult={ok:true}|{ok:false;code:string};
export function validateProfileJoin(input:ProfileJoinInput):ProfileJoinResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
