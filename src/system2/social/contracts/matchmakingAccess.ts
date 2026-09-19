export type MatchmakingAccessContract={actorId:string;enabled:boolean};export const validateMatchmakingAccess=(v:MatchmakingAccessContract)=>v.actorId.trim().length>0&&v.enabled;
