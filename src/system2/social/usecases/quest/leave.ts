export const QUEST_LEAVE_USE_CASE='quest.leave' as const;
export type QuestLeaveInput={actorId:string;targetId?:string};
export type QuestLeaveResult={ok:true}|{ok:false;code:string};
export function validateQuestLeave(input:QuestLeaveInput):QuestLeaveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
