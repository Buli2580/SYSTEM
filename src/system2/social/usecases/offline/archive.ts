export const OFFLINE_ARCHIVE_USE_CASE='offline.archive' as const;
export type OfflineArchiveInput={actorId:string;targetId?:string};
export type OfflineArchiveResult={ok:true}|{ok:false;code:string};
export function validateOfflineArchive(input:OfflineArchiveInput):OfflineArchiveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
