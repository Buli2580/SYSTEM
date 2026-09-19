export type QuestShareContract={actorId:string;enabled:boolean};export const validateQuestShare=(v:QuestShareContract)=>v.actorId.trim().length>0&&v.enabled;
