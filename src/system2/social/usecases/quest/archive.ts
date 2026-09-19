export const QUEST_ARCHIVE_USE_CASE='quest.archive' as const;
export type QuestArchiveInput={actorId:string;targetId?:string};
export type QuestArchiveResult={ok:true}|{ok:false;code:string};
export function validateQuestArchive(input:QuestArchiveInput):QuestArchiveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
