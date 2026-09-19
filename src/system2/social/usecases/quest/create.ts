export const QUEST_CREATE_USE_CASE='quest.create' as const;
export type QuestCreateInput={actorId:string;targetId?:string};
export type QuestCreateResult={ok:true}|{ok:false;code:string};
export function validateQuestCreate(input:QuestCreateInput):QuestCreateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
