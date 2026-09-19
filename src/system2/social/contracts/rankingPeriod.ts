export type RankingPeriodContract={actorId:string;enabled:boolean};export const validateRankingPeriod=(v:RankingPeriodContract)=>v.actorId.trim().length>0&&v.enabled;
