export const QUEST_UPDATE_USE_CASE='quest.update' as const;
export type QuestUpdateInput={actorId:string;targetId?:string};
export type QuestUpdateResult={ok:true}|{ok:false;code:string};
export function validateQuestUpdate(input:QuestUpdateInput):QuestUpdateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
