export const QUEST_REMOVE_USE_CASE='quest.remove' as const;
export type QuestRemoveInput={actorId:string;targetId?:string};
export type QuestRemoveResult={ok:true}|{ok:false;code:string};
export function validateQuestRemove(input:QuestRemoveInput):QuestRemoveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
