export type FeedRankingContract={actorId:string;enabled:boolean};export const validateFeedRanking=(v:FeedRankingContract)=>v.actorId.trim().length>0&&v.enabled;
