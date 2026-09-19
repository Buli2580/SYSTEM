export type RankingScopeContract={actorId:string;enabled:boolean};export const validateRankingScope=(v:RankingScopeContract)=>v.actorId.trim().length>0&&v.enabled;
