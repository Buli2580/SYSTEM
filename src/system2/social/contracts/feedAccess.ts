export type FeedAccessContract={actorId:string;enabled:boolean};export const validateFeedAccess=(v:FeedAccessContract)=>v.actorId.trim().length>0&&v.enabled;
