export type RankingAccessContract={actorId:string;enabled:boolean};export const validateRankingAccess=(v:RankingAccessContract)=>v.actorId.trim().length>0&&v.enabled;
