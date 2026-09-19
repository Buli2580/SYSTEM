export const PROFILE_REMOVE_USE_CASE='profile.remove' as const;
export type ProfileRemoveInput={actorId:string;targetId?:string};
export type ProfileRemoveResult={ok:true}|{ok:false;code:string};
export function validateProfileRemove(input:ProfileRemoveInput):ProfileRemoveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
