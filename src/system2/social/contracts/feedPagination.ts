export type FeedPaginationContract={actorId:string;enabled:boolean};export const validateFeedPagination=(v:FeedPaginationContract)=>v.actorId.trim().length>0&&v.enabled;
