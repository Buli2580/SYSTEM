export const PRESENCE_ARCHIVE_USE_CASE='presence.archive' as const;
export type PresenceArchiveInput={actorId:string;targetId?:string};
export type PresenceArchiveResult={ok:true}|{ok:false;code:string};
export function validatePresenceArchive(input:PresenceArchiveInput):PresenceArchiveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
