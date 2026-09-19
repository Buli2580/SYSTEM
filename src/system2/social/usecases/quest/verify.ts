export const QUEST_VERIFY_USE_CASE='quest.verify' as const;
export type QuestVerifyInput={actorId:string;targetId?:string};
export type QuestVerifyResult={ok:true}|{ok:false;code:string};
export function validateQuestVerify(input:QuestVerifyInput):QuestVerifyResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
