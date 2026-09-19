export type FriendshipPrivacyContract={actorId:string;enabled:boolean};export const validateFriendshipPrivacy=(v:FriendshipPrivacyContract)=>v.actorId.trim().length>0&&v.enabled;
