export const QUEST_REJECT_USE_CASE='quest.reject' as const;
export type QuestRejectInput={actorId:string;targetId?:string};
export type QuestRejectResult={ok:true}|{ok:false;code:string};
export function validateQuestReject(input:QuestRejectInput):QuestRejectResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
