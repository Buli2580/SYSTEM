export const PROFILE_READ_USE_CASE='profile.read' as const;
export type ProfileReadInput={actorId:string;targetId?:string};
export type ProfileReadResult={ok:true}|{ok:false;code:string};
export function validateProfileRead(input:ProfileReadInput):ProfileReadResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
