export type QuestAccessContract={actorId:string;enabled:boolean};export const validateQuestAccess=(v:QuestAccessContract)=>v.actorId.trim().length>0&&v.enabled;
