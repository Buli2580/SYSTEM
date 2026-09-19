export const RIVAL_ARCHIVE_USE_CASE='rival.archive' as const;
export type RivalArchiveInput={actorId:string;targetId?:string};
export type RivalArchiveResult={ok:true}|{ok:false;code:string};
export function validateRivalArchive(input:RivalArchiveInput):RivalArchiveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
