export const PRIVACY_ARCHIVE_USE_CASE='privacy.archive' as const;
export type PrivacyArchiveInput={actorId:string;targetId?:string};
export type PrivacyArchiveResult={ok:true}|{ok:false;code:string};
export function validatePrivacyArchive(input:PrivacyArchiveInput):PrivacyArchiveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
