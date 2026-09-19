export const PROFILE_ACCEPT_USE_CASE='profile.accept' as const;
export type ProfileAcceptInput={actorId:string;targetId?:string};
export type ProfileAcceptResult={ok:true}|{ok:false;code:string};
export function validateProfileAccept(input:ProfileAcceptInput):ProfileAcceptResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
