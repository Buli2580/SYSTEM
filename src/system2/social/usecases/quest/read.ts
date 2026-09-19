export const QUEST_READ_USE_CASE='quest.read' as const;
export type QuestReadInput={actorId:string;targetId?:string};
export type QuestReadResult={ok:true}|{ok:false;code:string};
export function validateQuestRead(input:QuestReadInput):QuestReadResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
