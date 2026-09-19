export const PROFILE_VERIFY_USE_CASE='profile.verify' as const;
export type ProfileVerifyInput={actorId:string;targetId?:string};
export type ProfileVerifyResult={ok:true}|{ok:false;code:string};
export function validateProfileVerify(input:ProfileVerifyInput):ProfileVerifyResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
