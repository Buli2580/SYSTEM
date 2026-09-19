export const SYNC_ARCHIVE_USE_CASE='sync.archive' as const;
export type SyncArchiveInput={actorId:string;targetId?:string};
export type SyncArchiveResult={ok:true}|{ok:false;code:string};
export function validateSyncArchive(input:SyncArchiveInput):SyncArchiveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
