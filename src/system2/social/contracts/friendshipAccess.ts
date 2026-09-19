export type FriendshipAccessContract={actorId:string;enabled:boolean};export const validateFriendshipAccess=(v:FriendshipAccessContract)=>v.actorId.trim().length>0&&v.enabled;
