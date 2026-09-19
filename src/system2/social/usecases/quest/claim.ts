export const QUEST_CLAIM_USE_CASE='quest.claim' as const;
export type QuestClaimInput={actorId:string;targetId?:string};
export type QuestClaimResult={ok:true}|{ok:false;code:string};
export function validateQuestClaim(input:QuestClaimInput):QuestClaimResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
