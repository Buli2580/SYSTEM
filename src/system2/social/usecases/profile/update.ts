export const PROFILE_UPDATE_USE_CASE='profile.update' as const;
export type ProfileUpdateInput={actorId:string;targetId?:string};
export type ProfileUpdateResult={ok:true}|{ok:false;code:string};
export function validateProfileUpdate(input:ProfileUpdateInput):ProfileUpdateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
