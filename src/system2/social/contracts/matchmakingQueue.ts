export type MatchmakingQueueContract={actorId:string;enabled:boolean};export const validateMatchmakingQueue=(v:MatchmakingQueueContract)=>v.actorId.trim().length>0&&v.enabled;
