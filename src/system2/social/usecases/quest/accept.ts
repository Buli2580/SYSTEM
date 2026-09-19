export const QUEST_ACCEPT_USE_CASE='quest.accept' as const;
export type QuestAcceptInput={actorId:string;targetId?:string};
export type QuestAcceptResult={ok:true}|{ok:false;code:string};
export function validateQuestAccept(input:QuestAcceptInput):QuestAcceptResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
