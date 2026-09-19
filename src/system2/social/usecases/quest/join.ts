export const QUEST_JOIN_USE_CASE='quest.join' as const;
export type QuestJoinInput={actorId:string;targetId?:string};
export type QuestJoinResult={ok:true}|{ok:false;code:string};
export function validateQuestJoin(input:QuestJoinInput):QuestJoinResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
