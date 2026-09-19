export const PROFILE_ARCHIVE_USE_CASE='profile.archive' as const;
export type ProfileArchiveInput={actorId:string;targetId?:string};
export type ProfileArchiveResult={ok:true}|{ok:false;code:string};
export function validateProfileArchive(input:ProfileArchiveInput):ProfileArchiveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
