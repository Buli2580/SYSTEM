export const EVENT_ARCHIVE_USE_CASE='event.archive' as const;
export type EventArchiveInput={actorId:string;targetId?:string};
export type EventArchiveResult={ok:true}|{ok:false;code:string};
export function validateEventArchive(input:EventArchiveInput):EventArchiveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
