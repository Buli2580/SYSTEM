export type FriendshipEventsContract={actorId:string;enabled:boolean};export const validateFriendshipEvents=(v:FriendshipEventsContract)=>v.actorId.trim().length>0&&v.enabled;
