export const MODERATION_ARCHIVE_USE_CASE='moderation.archive' as const;
export type ModerationArchiveInput={actorId:string;targetId?:string};
export type ModerationArchiveResult={ok:true}|{ok:false;code:string};
export function validateModerationArchive(input:ModerationArchiveInput):ModerationArchiveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
