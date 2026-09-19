export const PROFILE_CREATE_USE_CASE='profile.create' as const;
export type ProfileCreateInput={actorId:string;targetId?:string};
export type ProfileCreateResult={ok:true}|{ok:false;code:string};
export function validateProfileCreate(input:ProfileCreateInput):ProfileCreateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
