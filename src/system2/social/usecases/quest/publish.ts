export const QUEST_PUBLISH_USE_CASE='quest.publish' as const;
export type QuestPublishInput={actorId:string;targetId?:string};
export type QuestPublishResult={ok:true}|{ok:false;code:string};
export function validateQuestPublish(input:QuestPublishInput):QuestPublishResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
